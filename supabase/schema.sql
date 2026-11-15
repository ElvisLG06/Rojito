-- =====================================================================
-- Rojito: base de datos en Supabase
-- Pega TODO este archivo en Supabase > SQL Editor > New query > Run.
-- Se puede volver a ejecutar sin problema.
-- =====================================================================

-- 1) Clave familiar (va en un esquema privado: la API no lo expone)
create schema if not exists private;
create table if not exists private.config (clave text not null);

-- Devuelve true si la petición trae la clave familiar correcta
-- (la app la manda en la cabecera "x-clave-familia").
create or replace function public.clave_ok()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.config c
    where c.clave = coalesce(
      nullif(current_setting('request.headers', true), '')::json ->> 'x-clave-familia',
      ''
    )
  );
$$;
grant execute on function public.clave_ok() to anon, authenticated;

-- Consulta mínima que usa la tarea automática para que el proyecto no se pause
create or replace function public.ping()
returns integer
language sql
stable
as $$ select 1 $$;
grant execute on function public.ping() to anon, authenticated;

-- 2) Tabla de registros
create table if not exists public.registros (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null,
  fecha       date not null,
  costo       numeric(10, 2),
  lugar       text,
  comentarios text,
  km          integer,
  datos       jsonb not null default '{}'::jsonb,
  fotos       text[] not null default '{}',
  autor       text,
  creado      timestamptz not null default now(),
  actualizado timestamptz
);
create index if not exists registros_fecha_idx on public.registros (fecha desc, creado desc);

alter table public.registros enable row level security;
grant select, insert, update, delete on public.registros to anon, authenticated;

drop policy if exists "familia_ve"       on public.registros;
drop policy if exists "familia_agrega"   on public.registros;
drop policy if exists "familia_edita"    on public.registros;
drop policy if exists "familia_elimina"  on public.registros;
create policy "familia_ve"      on public.registros for select to anon, authenticated using (public.clave_ok());
create policy "familia_agrega"  on public.registros for insert to anon, authenticated with check (public.clave_ok());
create policy "familia_edita"   on public.registros for update to anon, authenticated using (public.clave_ok()) with check (public.clave_ok());
create policy "familia_elimina" on public.registros for delete to anon, authenticated using (public.clave_ok());

-- 3) Fotos (bucket privado, máx. 5 MB por foto)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "rojito_fotos_ver"      on storage.objects;
drop policy if exists "rojito_fotos_subir"    on storage.objects;
drop policy if exists "rojito_fotos_eliminar" on storage.objects;
create policy "rojito_fotos_ver"      on storage.objects for select to anon, authenticated using (bucket_id = 'fotos' and public.clave_ok());
create policy "rojito_fotos_subir"    on storage.objects for insert to anon, authenticated with check (bucket_id = 'fotos' and public.clave_ok());
create policy "rojito_fotos_eliminar" on storage.objects for delete to anon, authenticated using (bucket_id = 'fotos' and public.clave_ok());

-- 4) Guarda la clave familiar.
--    Reemplaza PEGA_AQUI_LA_CLAVE por la clave que te dieron y ejecuta SOLO estas dos líneas.
--    (No subas la clave real a GitHub: este archivo es público.)
-- delete from private.config;
-- insert into private.config (clave) values ('PEGA_AQUI_LA_CLAVE');
