-- 0005 — Identidade visual pública do canal (brandingSettings de channels.list, sem custo extra de cota)
alter table public.youtube_channels
  add column banner_url text,
  add column keywords text[] not null default '{}';
