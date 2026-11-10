-- 0007 — Ajuste manual de créditos pelo admin (cortesia, correção, venda manual antes do Stripe)
-- O motivo (note) aparece no extrato do usuário; actor_id guarda quem fez.

alter table public.credit_ledger
  add column note text check (note is null or char_length(note) between 3 and 200),
  add column actor_id uuid references public.profiles (id) on delete set null;

-- Soma (ou subtrai) créditos de um balde. Nunca deixa o saldo negativo. Devolve o novo saldo do balde.
-- A permissão (quem pode ajustar quem) é checada no servidor antes da chamada; aqui só o service role executa.
create function public.adjust_credits(
  p_user uuid,
  p_bucket text,
  p_amount integer,
  p_note text,
  p_actor uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current integer;
  v_next integer;
begin
  if p_bucket not in ('free', 'purchased') then raise exception 'invalid_bucket'; end if;
  if p_amount = 0 or abs(p_amount) > 1000 then raise exception 'invalid_amount'; end if;
  if p_note is null or char_length(trim(p_note)) < 3 or char_length(p_note) > 200 then raise exception 'invalid_note'; end if;

  insert into public.credit_balances (user_id) values (p_user) on conflict (user_id) do nothing;

  if p_bucket = 'free' then
    select free into v_current from public.credit_balances where user_id = p_user for update;
  else
    select purchased into v_current from public.credit_balances where user_id = p_user for update;
  end if;

  v_next := v_current + p_amount;
  if v_next < 0 then
    raise exception 'insufficient_balance' using errcode = 'P0001', detail = v_current::text;
  end if;

  insert into public.credit_ledger (user_id, bucket, amount, reason, note, actor_id)
  values (p_user, p_bucket, p_amount, 'adjustment', trim(p_note), p_actor);

  if p_bucket = 'free' then
    update public.credit_balances set free = v_next, updated_at = now() where user_id = p_user;
  else
    update public.credit_balances set purchased = v_next, updated_at = now() where user_id = p_user;
  end if;

  return v_next;
end;
$$;

revoke execute on function public.adjust_credits(uuid, text, integer, text, uuid) from public, anon, authenticated;
grant execute on function public.adjust_credits(uuid, text, integer, text, uuid) to service_role;
