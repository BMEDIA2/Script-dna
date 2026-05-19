-- Script DNA · Supabase Setup
-- Pega esto en: Supabase Dashboard → SQL Editor → Run

create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cta text,
  tono text[],
  tuteo text default 'tu',
  created_at timestamptz default now()
);

create table if not exists library_items (
  id text primary key,
  persona_id uuid references personas(id) on delete cascade,
  type text,
  label text,
  url text,
  text text,
  chars int,
  categoria text default 'general',
  created_at timestamptz default now()
);

create table if not exists chat_history (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references personas(id) on delete cascade,
  role text,
  content text,
  created_at timestamptz default now()
);

create table if not exists mapa_mental (
  persona_id uuid primary key references personas(id) on delete cascade,
  data jsonb,
  updated_at timestamptz default now()
);

-- Permitir acceso anon (compartido en equipo con anon key)
alter table personas enable row level security;
alter table library_items enable row level security;
alter table chat_history enable row level security;
alter table mapa_mental enable row level security;

create policy "anon full access personas" on personas for all using (true) with check (true);
create policy "anon full access library" on library_items for all using (true) with check (true);
create policy "anon full access chat" on chat_history for all using (true) with check (true);
create policy "anon full access mapa" on mapa_mental for all using (true) with check (true);

-- ═══════════════════════════════════════════
-- Banco de guiones (scripts_bank)
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════
create table if not exists scripts_bank (
  id text primary key,
  persona_id uuid references personas(id) on delete cascade,
  script jsonb,
  date text,
  created_at timestamptz default now()
);

alter table scripts_bank enable row level security;

create policy "approved access scripts_bank" on scripts_bank
  for all
  using  (exists (select 1 from profiles where id = auth.uid() and approved = true))
  with check (exists (select 1 from profiles where id = auth.uid() and approved = true));
