-- ============================================================================
-- Golden Eagle Academy — RBAC de 3 roles (admin / teacher / student)
--
-- Migración NUEVA e idempotente. NO edita 0001_init.sql ni 0002_security.sql.
-- Puede ejecutarse varias veces sin efectos secundarios.
--
--   admin   → Administrador general: gestiona usuarios y sus roles y tiene
--             acceso total a todo lo del profesor.
--   teacher → Profesor: gestiona SUS cursos, módulos, banco de preguntas,
--             asignaciones y ve a sus alumnos.
--   student → Alumno: rinde exámenes; NUNCA lee el banco de preguntas.
--
-- INVARIANTE CRÍTICO (intacto): los alumnos jamás leen `questions`
-- directamente; reciben las preguntas saneadas por la Edge Function `exam`.
--
-- NOTA sobre enums: en PostgreSQL un valor de enum recién agregado no puede
-- usarse como literal en la MISMA transacción que lo creó. Por eso todas las
-- comparaciones con 'admin' se hacen con cast a texto (role::text = 'admin'),
-- lo que es seguro en una sola transacción. El único uso del literal es el
-- bootstrap del primer admin, protegido con un bloque que no falla la
-- migración si el enum aún no se confirmó (ver el paso 6).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Agrega el valor 'admin' al enum user_role (idempotente).
-- ---------------------------------------------------------------------------
alter type public.user_role add value if not exists 'admin';

-- ---------------------------------------------------------------------------
-- 2. Helper is_admin(uid) — análogo a is_teacher. SECURITY DEFINER para
--    evitar recursión de RLS. Usa cast a texto (seguro en la misma
--    transacción que el ALTER TYPE de arriba).
-- ---------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = uid and role::text = 'admin');
$$;

-- Helper: ¿el profesor `uid` tiene a `sid` como alumno de alguno de sus cursos?
-- Se usa para acotar qué perfiles ve un profesor.
create or replace function public.teaches_student(uid uuid, sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where c.teacher_id = uid and e.student_id = sid
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. RPC admin_set_role(target_user, new_role): sólo un admin puede cambiar
--    roles. Impide dejar el sistema sin administradores.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_role(target_user uuid, new_role public.user_role)
returns void language plpgsql security definer set search_path = public as $$
declare
  admin_count int;
begin
  -- Sólo un administrador autenticado puede cambiar roles.
  if not public.is_admin(auth.uid()) then
    raise exception 'Solo un administrador puede cambiar roles.' using errcode = '42501';
  end if;

  -- No permitir quitar el último admin del sistema.
  if new_role::text <> 'admin' and public.is_admin(target_user) then
    select count(*) into admin_count from public.profiles where role::text = 'admin';
    if admin_count <= 1 then
      raise exception 'No puedes quitar el último administrador del sistema.' using errcode = 'P0001';
    end if;
  end if;

  update public.profiles set role = new_role where id = target_user;
  if not found then
    raise exception 'Usuario no encontrado.' using errcode = 'P0002';
  end if;
end $$;

revoke all on function public.admin_set_role(uuid, public.user_role) from public, anon;
grant execute on function public.admin_set_role(uuid, public.user_role) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Ajusta guard_profile_role: el cambio de rol lo pueden hacer service_role
--    O un admin (vía la RPC). Se mantiene bloqueado el auto-cambio de rol de
--    un usuario normal.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.role() <> 'service_role'
     and not public.is_admin(auth.uid()) then
    new.role := old.role;
  end if;
  return new;
end $$;

-- (El trigger trg_guard_profile_role ya existe desde 0001 y sigue apuntando a
--  esta función; basta con haber redefinido la función.)

-- ---------------------------------------------------------------------------
-- 5. Políticas RLS. Se AGREGAN políticas de admin (que combinan por OR con las
--    existentes) sin borrar la lógica de profesor/alumno. La única política
--    reescrita es profiles_select, para acotar el alcance del profesor a sus
--    propios alumnos y dar a los admin visibilidad total.
-- ---------------------------------------------------------------------------

-- profiles: cada quien ve el suyo; admin ve todos; profesor ve su perfil +
-- los alumnos de sus cursos. El cambio de rol sigue yendo por admin_set_role.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin(auth.uid())
    or public.teaches_student(auth.uid(), id)
  );

-- Un admin puede leer/gestionar cualquier perfil (además de su propio UPDATE,
-- que ya cubre profiles_update de 0001). El cambio de rol se hace por la RPC.
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- courses: admin con acceso total (se suma por OR a las de profesor/alumno).
drop policy if exists courses_admin_all on public.courses;
create policy courses_admin_all on public.courses for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- enrollments
drop policy if exists enroll_admin_all on public.enrollments;
create policy enroll_admin_all on public.enrollments for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- modules
drop policy if exists modules_admin_all on public.modules;
create policy modules_admin_all on public.modules for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- questions: admin con acceso total. Los alumnos SIGUEN sin política de lectura.
drop policy if exists questions_admin_all on public.questions;
create policy questions_admin_all on public.questions for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- assignments
drop policy if exists assign_admin_all on public.assignments;
create policy assign_admin_all on public.assignments for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- attempts
drop policy if exists attempts_admin_all on public.attempts;
create policy attempts_admin_all on public.attempts for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 6. Bootstrap del primer admin (idempotente).
--    Promueve felipe.loyolamejias@gmail.com a 'admin' si ya existe su perfil.
--    Se protege con un bloque que NO falla la migración cuando el valor de
--    enum 'admin' aún no está confirmado (caso de aplicarla en UNA sola
--    transacción, p. ej. `supabase db push`). En ese caso, vuelve a ejecutar
--    esta migración o corre la promoción manual (ver SETUP.md).
-- ---------------------------------------------------------------------------
do $$
begin
  -- Se desactiva momentáneamente el guard de rol para poder promover al primer
  -- admin (que aún no lo es). El resto de cambios de rol siguen pasando por
  -- admin_set_role / service_role.
  alter table public.profiles disable trigger trg_guard_profile_role;
  update public.profiles set role = 'admin'
   where email = 'felipe.loyolamejias@gmail.com';
  alter table public.profiles enable trigger trg_guard_profile_role;
exception when others then
  -- Reactiva el trigger aunque algo falle (p. ej. el valor de enum 'admin' aún
  -- no está confirmado por aplicarse en UNA sola transacción, `supabase db push`).
  begin
    alter table public.profiles enable trigger trg_guard_profile_role;
  exception when others then null;
  end;
  raise notice 'Bootstrap admin diferido (%). Re-ejecuta esta migración o corre: update public.profiles set role = ''admin'' where email = ''felipe.loyolamejias@gmail.com'';', sqlerrm;
end $$;
