-- 0001 — Perfis, papéis e RLS
-- Papéis: superadmin (único) > admin > user.
-- Toda escrita em profiles é feita pelo servidor com service role, após checar o papel.

create type public.app_role as enum ('superadmin', 'admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null,
  role public.app_role not null default 'user',
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create unique index profiles_email_key on public.profiles (lower(email));
-- No máximo um superadmin no sistema
create unique index profiles_single_superadmin on public.profiles (role) where role = 'superadmin';

-- updated_at automático
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Cria o profile quando um usuário de auth é criado.
-- O papel é SEMPRE 'user' aqui; nunca é lido do metadata (evita escalada de privilégio).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Papel do usuário logado (security definer evita recursão de RLS)
create function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

revoke execute on function public.current_app_role() from public, anon;
grant execute on function public.current_app_role() to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- RLS
alter table public.profiles enable row level security;

create policy "profiles: ler o próprio"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy "profiles: admins leem todos"
on public.profiles for select
to authenticated
using ((select public.current_app_role()) in ('admin', 'superadmin'));

-- Sem policies de insert/update/delete: clientes autenticados não escrevem em profiles.
revoke insert, update, delete on public.profiles from anon, authenticated;
revoke all on public.profiles from anon;
