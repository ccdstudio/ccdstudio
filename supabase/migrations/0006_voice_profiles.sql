-- 0006 — Perfil de voz do criador (templates/voice.md da skill), injetado em todos os prompts de IA.
create table public.voice_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  niche text not null default '',
  audience text not null default '',
  tone text not null default '',
  uses text[] not null default '{}',       -- expressões e termos que o criador usa
  avoids text[] not null default '{}',     -- palavras que NÃO são dele
  wont_claim text[] not null default '{}', -- o que ele não afirma/promete
  format text not null default '',         -- formato dos vídeos (duração, abertura, Shorts…)
  source text not null default 'ai' check (source in ('ai', 'manual')),
  updated_at timestamptz not null default now()
);

alter table public.voice_profiles enable row level security;

create policy "voice_profiles: ler o próprio" on public.voice_profiles for select to authenticated
using (user_id = (select auth.uid()));

revoke insert, update, delete on public.voice_profiles from anon, authenticated;
revoke all on public.voice_profiles from anon;
