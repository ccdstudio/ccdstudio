-- 0002 — Canal do YouTube do usuário + cache da YouTube Data API
-- profiles.youtube_channel_id: vínculo usuário → canal (1 canal por usuário).
-- youtube_channels: cache das respostas de channels.list (expira em 24h), compartilhado entre usuários.
-- youtube_api_usage: unidades de cota gastas por dia (fuso do Pacífico, o da cota).
-- Toda escrita é feita pelo servidor com service role.

create table public.youtube_channels (
  id text primary key check (id ~ '^UC[A-Za-z0-9_-]{22}$'),
  handle text,
  title text not null default '',
  description text not null default '',
  thumbnail_url text,
  country text,
  published_at timestamptz,
  uploads_playlist_id text,
  subscriber_count bigint, -- null quando o dono oculta os inscritos
  view_count bigint,
  video_count bigint,
  raw jsonb not null default '{}'::jsonb, -- item completo de channels.list
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index youtube_channels_expires_at_idx on public.youtube_channels (expires_at);

create trigger youtube_channels_set_updated_at
before update on public.youtube_channels
for each row execute function public.set_updated_at();

alter table public.profiles
  add column youtube_channel_id text references public.youtube_channels (id) on delete set null;

create index profiles_youtube_channel_id_idx on public.profiles (youtube_channel_id);

-- Cota
create table public.youtube_api_usage (
  day date primary key,
  units_used integer not null default 0
);

create function public.increment_youtube_usage(units integer)
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.youtube_api_usage as u (day, units_used)
  values ((now() at time zone 'America/Los_Angeles')::date, units)
  on conflict (day) do update set units_used = u.units_used + excluded.units_used
  returning units_used
$$;

revoke execute on function public.increment_youtube_usage(integer) from public, anon, authenticated;
grant execute on function public.increment_youtube_usage(integer) to service_role;

-- RLS
alter table public.youtube_channels enable row level security;
alter table public.youtube_api_usage enable row level security;

create policy "youtube_channels: ler o próprio canal"
on public.youtube_channels for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.youtube_channel_id = youtube_channels.id
  )
);

create policy "youtube_channels: admins leem todos"
on public.youtube_channels for select
to authenticated
using ((select public.current_app_role()) in ('admin', 'superadmin'));

revoke insert, update, delete on public.youtube_channels from anon, authenticated;
revoke all on public.youtube_channels from anon;
revoke all on public.youtube_api_usage from anon, authenticated;
