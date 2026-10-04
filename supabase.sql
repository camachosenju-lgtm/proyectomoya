-- ============================================================
-- POCKETWORK · Tablas nuevas: reportes, seguimientos, vistas,
-- retos + perfil laboral. Ejecutar en Supabase > SQL Editor.
-- El control de rol admin vive en `perfiles.tipo_cuenta`
-- ('standard' | 'admin' | 'suspendido'), ya existente.
-- ============================================================

-- 1. Reportes de proyectos, comentarios o perfiles
create table if not exists public.reportes (
  id uuid primary key default gen_random_uuid(),
  reportado_por uuid not null,
  tipo text not null check (tipo in ('proyecto', 'comentario', 'perfil')),
  objetivo_id text not null,
  motivo text not null,
  detalle text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'revisado', 'desestimado')),
  creado_el timestamptz not null default now()
);
create index if not exists idx_reportes_estado on public.reportes (estado);

-- 2. Seguimientos entre usuarios
create table if not exists public.seguimientos (
  id uuid primary key default gen_random_uuid(),
  seguidor_id uuid not null,
  seguido_id uuid not null,
  creado_el timestamptz not null default now(),
  unique (seguidor_id, seguido_id),
  check (seguidor_id <> seguido_id)
);
create index if not exists idx_seg_seguidor on public.seguimientos (seguidor_id);
create index if not exists idx_seg_seguido on public.seguimientos (seguido_id);

-- 3. Vistas de proyectos (estadísticas del artista)
create table if not exists public.vistas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null,
  usuario_id uuid,
  creado_el timestamptz not null default now()
);
create index if not exists idx_vistas_proyecto on public.vistas (proyecto_id);

-- 4. Retos creativos (los crea el admin)
create table if not exists public.retos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  termina_el date,
  activo boolean not null default true,
  creado_por uuid,
  creado_el timestamptz not null default now()
);

-- 5. Participaciones en retos
create table if not exists public.reto_participaciones (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references public.retos (id) on delete cascade,
  proyecto_id uuid not null,
  usuario_id uuid not null,
  creado_el timestamptz not null default now(),
  unique (reto_id, proyecto_id)
);
create index if not exists idx_part_reto on public.reto_participaciones (reto_id);

-- 6. Perfil laboral (resto de columnas ya existen)
alter table public.perfiles
  add column if not exists disponible_trabajo boolean not null default false;
alter table public.perfiles add column if not exists area_trabajo text;
alter table public.perfiles add column if not exists contacto_trabajo text;

-- 7. RLS permisivo (mismo modelo que el resto de la app)
alter table public.reportes enable row level security;
alter table public.seguimientos enable row level security;
alter table public.vistas enable row level security;
alter table public.retos enable row level security;
alter table public.reto_participaciones enable row level security;

drop policy if exists "acceso total" on public.reportes;
create policy "acceso total" on public.reportes
  for all using (true) with check (true);

drop policy if exists "acceso total" on public.seguimientos;
create policy "acceso total" on public.seguimientos
  for all using (true) with check (true);

drop policy if exists "acceso total" on public.vistas;
create policy "acceso total" on public.vistas
  for all using (true) with check (true);

drop policy if exists "acceso total" on public.retos;
create policy "acceso total" on public.retos
  for all using (true) with check (true);

drop policy if exists "acceso total" on public.reto_participaciones;
create policy "acceso total" on public.reto_participaciones
  for all using (true) with check (true);

-- 8. Primer admin 
-- update public.perfiles set tipo_cuenta = 'admin'
-- where id = (select id from auth.users where email = 'mora.garrido.cd@gmail.com');
