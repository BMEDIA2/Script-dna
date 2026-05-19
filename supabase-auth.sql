-- Script DNA · Autenticación + Aprobación de usuarios
-- Ejecuta esto en: Supabase Dashboard → SQL Editor → Run

-- ═══════════════════════════════════════════
-- 1. Tabla de perfiles (aprobación manual)
-- ═══════════════════════════════════════════
create table if not exists profiles (
  id      uuid primary key references auth.users(id) on delete cascade,
  email   text,
  approved boolean default false,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- El usuario solo puede leer su propio perfil
create policy "user reads own profile" on profiles
  for select using (auth.uid() = id);

-- Solo el admin (service role) puede actualizar aprobaciones
-- Los cambios de approved=true los hace el dueño desde el panel de la app o desde Supabase Dashboard


-- ═══════════════════════════════════════════
-- 2. Trigger: crear perfil automáticamente al registrarse
-- ═══════════════════════════════════════════
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, approved)
  values (new.id, new.email, false);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ═══════════════════════════════════════════
-- 3. Eliminar políticas abiertas anteriores
-- ═══════════════════════════════════════════
drop policy if exists "anon full access personas"    on personas;
drop policy if exists "anon full access library"     on library_items;
drop policy if exists "anon full access chat"        on chat_history;
drop policy if exists "anon full access mapa"        on mapa_mental;
drop policy if exists "auth access personas"         on personas;
drop policy if exists "auth access library"          on library_items;
drop policy if exists "auth access chat"             on chat_history;
drop policy if exists "auth access mapa"             on mapa_mental;


-- ═══════════════════════════════════════════
-- 4. Nuevas políticas: solo usuarios APROBADOS
-- ═══════════════════════════════════════════
create policy "approved access personas" on personas
  for all
  using  (exists (select 1 from profiles where id = auth.uid() and approved = true))
  with check (exists (select 1 from profiles where id = auth.uid() and approved = true));

create policy "approved access library" on library_items
  for all
  using  (exists (select 1 from profiles where id = auth.uid() and approved = true))
  with check (exists (select 1 from profiles where id = auth.uid() and approved = true));

create policy "approved access chat" on chat_history
  for all
  using  (exists (select 1 from profiles where id = auth.uid() and approved = true))
  with check (exists (select 1 from profiles where id = auth.uid() and approved = true));

create policy "approved access mapa" on mapa_mental
  for all
  using  (exists (select 1 from profiles where id = auth.uid() and approved = true))
  with check (exists (select 1 from profiles where id = auth.uid() and approved = true));


-- ═══════════════════════════════════════════
-- 5. Política de admin: puede leer TODOS los perfiles (para el panel de aprobación)
-- ═══════════════════════════════════════════
-- El dueño de la app necesita leer todos los perfiles pendientes.
-- Usamos una tabla de admins por email para identificarlo.
create table if not exists admins (
  email text primary key
);

-- Inserta aquí el email del dueño:
insert into admins (email) values ('nftremake@gmail.com') on conflict do nothing;

-- Política: los admins pueden leer todos los perfiles
create policy "admin reads all profiles" on profiles
  for select
  using (exists (select 1 from admins where email = (select email from auth.users where id = auth.uid())));

-- Política: los admins pueden actualizar (aprobar/rechazar) perfiles
create policy "admin updates profiles" on profiles
  for update
  using  (exists (select 1 from admins where email = (select email from auth.users where id = auth.uid())))
  with check (exists (select 1 from admins where email = (select email from auth.users where id = auth.uid())));

alter table admins enable row level security;
create policy "anyone reads admins" on admins for select using (true);
