-- 0003 — Créditos (dois baldes + ledger + reset mensal) e histórico das gerações de IA
-- Ver docs/SISTEMA-NOVO.md §5. Toda escrita passa por funções security definer chamadas com service role.

-- Planos ---------------------------------------------------------------------
create table public.plans (
  id text primary key, -- slug: 'gratuito', 'profissional'...
  name text not null,
  monthly_free_credits integer not null check (monthly_free_credits >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.plans (id, name, monthly_free_credits) values ('gratuito', 'Gratuito', 20);

alter table public.profiles
  add column plan_id text not null default 'gratuito' references public.plans (id);

-- Saldo e extrato ---------------------------------------------------------------
create table public.credit_balances (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  free integer not null default 0 check (free >= 0),
  purchased integer not null default 0 check (purchased >= 0),
  updated_at timestamptz not null default now()
);

create table public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  bucket text not null check (bucket in ('free', 'purchased')),
  amount integer not null,
  reason text not null check (reason in ('monthly_reset', 'usage', 'adjustment', 'purchase', 'refund', 'migration')),
  ref_id text,
  period text check (period ~ '^\d{4}-\d{2}$'),
  created_at timestamptz not null default now()
);

create index credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);
-- Idempotência do reset: um lançamento por usuário por mês
create unique index credit_ledger_monthly_reset_key on public.credit_ledger (user_id, period) where reason = 'monthly_reset';

-- Histórico das gerações ---------------------------------------------------------
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feature text not null,
  prompt_version text not null,
  model text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  tokens_in integer,
  tokens_out integer,
  credits_charged integer not null default 0,
  created_at timestamptz not null default now()
);

create index ai_generations_user_feature_idx on public.ai_generations (user_id, feature, created_at desc);

-- Funções ---------------------------------------------------------------------
create function public.current_credit_period()
returns text
language sql
stable
set search_path = ''
as $$
  select to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM')
$$;

-- Leva o balde "free" exatamente ao valor do plano (o que sobrou expira). Idempotente por período.
create function public.grant_monthly_free_credits(p_user uuid, p_period text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target integer;
  v_current integer;
begin
  select pl.monthly_free_credits into v_target
  from public.profiles p join public.plans pl on pl.id = p.plan_id
  where p.id = p_user;
  if v_target is null then return; end if;

  insert into public.credit_balances (user_id) values (p_user) on conflict (user_id) do nothing;
  select free into v_current from public.credit_balances where user_id = p_user for update;

  insert into public.credit_ledger (user_id, bucket, amount, reason, period)
  values (p_user, 'free', v_target - v_current, 'monthly_reset', p_period)
  on conflict (user_id, period) where reason = 'monthly_reset' do nothing;

  if found then
    update public.credit_balances set free = v_target, updated_at = now() where user_id = p_user;
  end if;
end;
$$;

create function public.reset_monthly_free_credits()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_period text := public.current_credit_period();
  v_count integer := 0;
  r record;
begin
  for r in select id from public.profiles loop
    perform public.grant_monthly_free_credits(r.id, v_period);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Debita (free primeiro, depois purchased) e grava a geração, numa única transação.
create function public.record_generation(
  p_user uuid,
  p_feature text,
  p_prompt_version text,
  p_model text,
  p_input jsonb,
  p_output jsonb,
  p_tokens_in integer,
  p_tokens_out integer,
  p_cost integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_free integer;
  v_purchased integer;
  v_from_free integer;
  v_from_purchased integer;
begin
  if p_cost < 0 then raise exception 'invalid_cost'; end if;

  select free, purchased into v_free, v_purchased
  from public.credit_balances where user_id = p_user for update;

  if v_free is null or v_free + v_purchased < p_cost then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  v_from_free := least(v_free, p_cost);
  v_from_purchased := p_cost - v_from_free;

  insert into public.ai_generations
    (id, user_id, feature, prompt_version, model, input, output, tokens_in, tokens_out, credits_charged)
  values
    (v_id, p_user, p_feature, p_prompt_version, p_model, p_input, p_output, p_tokens_in, p_tokens_out, p_cost);

  if v_from_free > 0 then
    insert into public.credit_ledger (user_id, bucket, amount, reason, ref_id)
    values (p_user, 'free', -v_from_free, 'usage', v_id::text);
  end if;
  if v_from_purchased > 0 then
    insert into public.credit_ledger (user_id, bucket, amount, reason, ref_id)
    values (p_user, 'purchased', -v_from_purchased, 'usage', v_id::text);
  end if;

  update public.credit_balances
  set free = free - v_from_free, purchased = purchased - v_from_purchased, updated_at = now()
  where user_id = p_user;

  return v_id;
end;
$$;

-- Novo perfil já recebe os créditos do mês
create function public.handle_new_profile_credits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.grant_monthly_free_credits(new.id, public.current_credit_period());
  return new;
end;
$$;

create trigger on_profile_created_credits
after insert on public.profiles
for each row execute function public.handle_new_profile_credits();

revoke execute on function public.grant_monthly_free_credits(uuid, text) from public, anon, authenticated;
revoke execute on function public.reset_monthly_free_credits() from public, anon, authenticated;
revoke execute on function public.record_generation(uuid, text, text, text, jsonb, jsonb, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.handle_new_profile_credits() from public, anon, authenticated;
grant execute on function public.grant_monthly_free_credits(uuid, text) to service_role;
grant execute on function public.reset_monthly_free_credits() to service_role;
grant execute on function public.record_generation(uuid, text, text, text, jsonb, jsonb, integer, integer, integer) to service_role;

-- Backfill dos perfis existentes
select public.grant_monthly_free_credits(id, public.current_credit_period()) from public.profiles;

-- RLS -------------------------------------------------------------------------
alter table public.plans enable row level security;
alter table public.credit_balances enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.ai_generations enable row level security;

create policy "plans: autenticados leem" on public.plans for select to authenticated using (true);

create policy "credit_balances: ler o próprio" on public.credit_balances for select to authenticated
using (user_id = (select auth.uid()));
create policy "credit_balances: admins leem todos" on public.credit_balances for select to authenticated
using ((select public.current_app_role()) in ('admin', 'superadmin'));

create policy "credit_ledger: ler o próprio" on public.credit_ledger for select to authenticated
using (user_id = (select auth.uid()));
create policy "credit_ledger: admins leem todos" on public.credit_ledger for select to authenticated
using ((select public.current_app_role()) in ('admin', 'superadmin'));

create policy "ai_generations: ler as próprias" on public.ai_generations for select to authenticated
using (user_id = (select auth.uid()));
create policy "ai_generations: admins leem todas" on public.ai_generations for select to authenticated
using ((select public.current_app_role()) in ('admin', 'superadmin'));

revoke insert, update, delete on public.plans, public.credit_balances, public.credit_ledger, public.ai_generations
  from anon, authenticated;
revoke all on public.plans, public.credit_balances, public.credit_ledger, public.ai_generations from anon;

-- Reset mensal: dia 1 às 03:00 de São Paulo (06:00 UTC)
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('reset-free-credits', '0 6 1 * *', $$select public.reset_monthly_free_credits()$$);
