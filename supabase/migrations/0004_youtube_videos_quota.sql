-- 0004 — Vídeos recentes do canal (cache) e contador de cota visível só para o superadmin

create table public.youtube_videos (
  id text primary key,
  channel_id text not null references public.youtube_channels (id) on delete cascade,
  title text not null default '',
  published_at timestamptz,
  thumbnail_url text,
  duration_seconds integer,
  is_short boolean not null default false, -- heurística: duração ≤ 180 s (não é oficial)
  view_count bigint,
  like_count bigint, -- null quando o dono oculta
  comment_count bigint, -- null quando os comentários estão desativados
  fetched_at timestamptz not null default now()
);

create index youtube_videos_channel_published_idx on public.youtube_videos (channel_id, published_at desc);

alter table public.youtube_channels add column videos_fetched_at timestamptz;

alter table public.youtube_videos enable row level security;

create policy "youtube_videos: ler os do próprio canal"
on public.youtube_videos for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.youtube_channel_id = youtube_videos.channel_id
  )
);

create policy "youtube_videos: admins leem todos"
on public.youtube_videos for select
to authenticated
using ((select public.current_app_role()) in ('admin', 'superadmin'));

revoke insert, update, delete on public.youtube_videos from anon, authenticated;
revoke all on public.youtube_videos from anon;

-- Cota: unidades + número de requisições do dia (fuso do Pacífico, o da cota do Google)
alter table public.youtube_api_usage
  add column requests integer not null default 0,
  add column updated_at timestamptz not null default now();

create or replace function public.increment_youtube_usage(units integer)
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.youtube_api_usage as u (day, units_used, requests, updated_at)
  values ((now() at time zone 'America/Los_Angeles')::date, units, 1, now())
  on conflict (day) do update
    set units_used = u.units_used + excluded.units_used,
        requests = u.requests + 1,
        updated_at = now()
  returning units_used
$$;

revoke execute on function public.increment_youtube_usage(integer) from public, anon, authenticated;
grant execute on function public.increment_youtube_usage(integer) to service_role;

grant select on public.youtube_api_usage to authenticated;
create policy "youtube_api_usage: só superadmin lê"
on public.youtube_api_usage for select
to authenticated
using ((select public.current_app_role()) = 'superadmin');
