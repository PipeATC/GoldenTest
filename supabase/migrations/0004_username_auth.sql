-- ============================================================================
-- Golden Eagle Academy — Autenticación por USUARIO + CLAVE (sin correo, sin Google)
--
-- Migración NUEVA e idempotente. NO edita 0001/0002/0003.
--
-- El acceso deja de usar correo/Google. Cada persona entra con un NOMBRE DE
-- USUARIO y una CLAVE. Las cuentas las crea un administrador desde el panel de
-- gestión de usuarios (Edge Function `admin-users`, rol de servicio).
--
-- Nota de implementación: por debajo se sigue usando Supabase Auth, que exige
-- un email por usuario. Se usa un email SINTÉTICO interno
-- `<usuario>@users.goldeneagle.local` que NUNCA se muestra ni se pide: es solo
-- la llave técnica de GoTrue. La app trabaja siempre con `profiles.username`.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles: nombre de usuario + bandera de cambio de clave obligatorio.
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists username citext;
alter table public.profiles add column if not exists must_change_password boolean not null default false;

-- Backfill de usuarios previos (si los hubiera): usuario = parte local del email.
update public.profiles
   set username = lower(split_part(email, '@', 1))
 where username is null;

create unique index if not exists profiles_username_key on public.profiles (username);

-- ---------------------------------------------------------------------------
-- 2. Matrículas por nombre de usuario (antes por correo).
--    Se conserva student_email por compatibilidad, ahora opcional.
-- ---------------------------------------------------------------------------
alter table public.enrollments add column if not exists student_username citext;
alter table public.enrollments alter column student_email drop not null;

create unique index if not exists enrollments_course_username_key
  on public.enrollments (course_id, student_username);

-- ---------------------------------------------------------------------------
-- 3. handle_new_user: crea el profile con username (desde metadata) y enlaza
--    matrículas pendientes por username.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uname citext;
begin
  uname := coalesce(
    new.raw_user_meta_data->>'username',
    lower(split_part(new.email, '@', 1))
  );

  insert into public.profiles (id, email, username, full_name, avatar_url)
  values (
    new.id,
    new.email,
    uname,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', uname),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  -- Enlaza matrículas creadas por username antes de existir el profile.
  update public.enrollments
     set student_id = new.id
   where student_id is null
     and lower(student_username) = lower(uname);

  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 4. link_my_enrollments: enlaza por username del profile actual.
-- ---------------------------------------------------------------------------
create or replace function public.link_my_enrollments()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.enrollments e
     set student_id = auth.uid()
    from public.profiles p
   where p.id = auth.uid()
     and e.student_id is null
     and lower(e.student_username) = lower(p.username);
end $$;

-- ---------------------------------------------------------------------------
-- 5. complete_password_change(): el usuario baja su propia bandera de cambio de
--    clave obligatorio tras actualizar la contraseña (Supabase Auth).
-- ---------------------------------------------------------------------------
create or replace function public.complete_password_change()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set must_change_password = false where id = auth.uid();
end $$;

revoke all on function public.complete_password_change() from public, anon;
grant execute on function public.complete_password_change() to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Bootstrap del PRIMER ADMINISTRADOR (idempotente).
--    Crea la cuenta de Supabase Auth `admin` (email sintético) con una clave
--    por defecto y la promueve a admin, marcándola para cambio de clave
--    obligatorio en el primer ingreso.
--
--    >>> CLAVE POR DEFECTO — CÁMBIALA EN EL PRIMER INGRESO <<<
--        usuario: admin
--        clave:   MU5Z-rYvH-wriM-WwDi
--
--    Requiere la extensión pgcrypto (crypt/gen_salt), disponible en Supabase.
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

do $$
declare
  admin_email text := 'admin@users.goldeneagle.local';
  admin_pass  text := 'MU5Z-rYvH-wriM-WwDi';
  uid uuid;
begin
  -- ¿Ya existe la cuenta admin? (idempotente)
  select id into uid from auth.users where email = admin_email;

  if uid is null then
    uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      admin_email, crypt(admin_pass, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"admin","full_name":"Administrador"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    -- Identidad de proveedor 'email' (requerida por GoTrue para login por clave).
    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      admin_email, uid,
      jsonb_build_object('sub', uid::text, 'email', admin_email), 'email',
      now(), now(), now()
    );
  end if;

  -- El trigger handle_new_user ya creó el profile; asegúralo (por si el trigger
  -- no estuviera activo) y promuévelo a admin con cambio de clave obligatorio.
  -- Se desactiva el guard de rol durante esta promoción del primer admin.
  alter table public.profiles disable trigger trg_guard_profile_role;
  insert into public.profiles (id, email, username, full_name, role, must_change_password)
  values (uid, admin_email, 'admin', 'Administrador', 'admin', true)
  on conflict (id) do update
    set role = 'admin',
        username = 'admin',
        must_change_password = true;
  alter table public.profiles enable trigger trg_guard_profile_role;

exception when others then
  begin
    alter table public.profiles enable trigger trg_guard_profile_role;
  exception when others then null;
  end;
  raise notice 'Bootstrap del primer admin no aplicado en esta pasada (%). Revisa SETUP.md (creación del primer admin).', sqlerrm;
end $$;
