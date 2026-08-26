-- ============================================================================
-- Golden Eagle Academy — Esquema inicial (Supabase / PostgreSQL)
-- Roles profesor/alumno, cursos, módulos, banco de preguntas, asignaciones
-- con bloque horario, e intentos de examen corregidos en el servidor.
--
-- Ejecutar en el SQL Editor de Supabase, o con `supabase db push`.
-- Toda la seguridad se aplica con Row Level Security (RLS): el banco de
-- preguntas NUNCA es legible por los alumnos; las 50 preguntas al azar y la
-- corrección se sirven a través de la Edge Function `exam` (rol de servicio).
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('teacher', 'student');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles: fila 1:1 con auth.users. El rol por defecto es 'student'.
-- Para crear el primer profesor, ejecuta tras registrarte:
--   update public.profiles set role = 'teacher' where email = 'tu@correo.com';
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  email      citext unique not null,
  full_name  text,
  avatar_url text,
  role       public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- courses: creados por un profesor.
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
  id          uuid primary key default uuid_generate_v4(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- enrollments: alumnos de un curso. Se registran por correo; cuando el alumno
-- inicia sesión por primera vez se enlaza su student_id automáticamente.
-- ---------------------------------------------------------------------------
create table if not exists public.enrollments (
  id            uuid primary key default uuid_generate_v4(),
  course_id     uuid not null references public.courses(id) on delete cascade,
  student_email citext not null,
  student_id    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (course_id, student_email)
);

-- ---------------------------------------------------------------------------
-- modules: una "prueba" dentro de un curso. Define cuántas preguntas al azar
-- se asignan (questions_per_exam), la duración del bloque y la nota de corte.
-- ---------------------------------------------------------------------------
create table if not exists public.modules (
  id                 uuid primary key default uuid_generate_v4(),
  course_id          uuid not null references public.courses(id) on delete cascade,
  title              text not null,
  description        text,
  duration_minutes   int  not null default 60,
  questions_per_exam int  not null default 50,
  passing_score      int  not null default 60,
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- questions: banco de preguntas del módulo (p.ej. 200). options es un array
-- JSON de strings; correct_index es 0-based. SÓLO los profesores lo leen.
-- ---------------------------------------------------------------------------
create table if not exists public.questions (
  id            uuid primary key default uuid_generate_v4(),
  module_id     uuid not null references public.modules(id) on delete cascade,
  prompt        text not null,
  options       jsonb not null,
  correct_index int  not null,
  explanation   text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- assignments: asigna un módulo a un alumno con un bloque horario opcional.
-- opens_at / closes_at definen la ventana en la que puede rendir la prueba.
-- ---------------------------------------------------------------------------
create table if not exists public.assignments (
  id         uuid primary key default uuid_generate_v4(),
  module_id  uuid not null references public.modules(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  opens_at   timestamptz,
  closes_at  timestamptz,
  created_at timestamptz not null default now(),
  unique (module_id, student_id)
);

-- ---------------------------------------------------------------------------
-- attempts: un intento por asignación. question_ids son las 50 seleccionadas.
-- score/status/correct_count SÓLO los fija la Edge Function (rol de servicio).
-- ---------------------------------------------------------------------------
create table if not exists public.attempts (
  id              uuid primary key default uuid_generate_v4(),
  assignment_id   uuid not null references public.assignments(id) on delete cascade,
  student_id      uuid not null references public.profiles(id) on delete cascade,
  module_id       uuid not null references public.modules(id) on delete cascade,
  question_ids    uuid[] not null,
  answers         jsonb  not null default '{}'::jsonb,
  score           int,
  correct_count   int,
  total           int,
  status          text   not null default 'in_progress',  -- in_progress | submitted | expired
  security_events jsonb  not null default '[]'::jsonb,
  started_at      timestamptz not null default now(),
  submitted_at    timestamptz,
  unique (assignment_id)
);

create index if not exists idx_courses_teacher    on public.courses(teacher_id);
create index if not exists idx_enroll_course      on public.enrollments(course_id);
create index if not exists idx_enroll_student     on public.enrollments(student_id);
create index if not exists idx_modules_course     on public.modules(course_id);
create index if not exists idx_questions_module   on public.questions(module_id);
create index if not exists idx_assign_student     on public.assignments(student_id);
create index if not exists idx_assign_module      on public.assignments(module_id);
create index if not exists idx_attempts_student   on public.attempts(student_id);

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER para evitar recursión de RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_teacher(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = uid and role = 'teacher');
$$;

create or replace function public.owns_course(uid uuid, cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.courses where id = cid and teacher_id = uid);
$$;

create or replace function public.owns_module(uid uuid, mid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.modules m
    join public.courses c on c.id = m.course_id
    where m.id = mid and c.teacher_id = uid
  );
$$;

-- Crea el profile al registrarse y enlaza matrículas pendientes por correo.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  update public.enrollments
     set student_id = new.id
   where student_id is null
     and lower(student_email) = lower(new.email);

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Impide que un usuario cambie su propio rol (sólo el rol de servicio puede).
create or replace function public.guard_profile_role()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    new.role := old.role;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role
  before update on public.profiles
  for each row execute procedure public.guard_profile_role();

-- Protege los campos de corrección de attempts frente a escritura del alumno.
create or replace function public.guard_attempt_fields()
returns trigger language plpgsql as $$
begin
  if auth.role() <> 'service_role' then
    new.score         := old.score;
    new.correct_count := old.correct_count;
    new.total         := old.total;
    new.status        := old.status;
    new.question_ids  := old.question_ids;
    new.submitted_at  := old.submitted_at;
    new.module_id     := old.module_id;
    new.assignment_id := old.assignment_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_attempt_fields on public.attempts;
create trigger trg_guard_attempt_fields
  before update on public.attempts
  for each row execute procedure public.guard_attempt_fields();

-- Enlaza manualmente las matrículas del usuario actual (por si se registró
-- antes de ser matriculado). La llama el cliente tras iniciar sesión.
create or replace function public.link_my_enrollments()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.enrollments e
     set student_id = auth.uid()
    from public.profiles p
   where p.id = auth.uid()
     and e.student_id is null
     and lower(e.student_email) = lower(p.email);
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.courses     enable row level security;
alter table public.enrollments enable row level security;
alter table public.modules     enable row level security;
alter table public.questions   enable row level security;
alter table public.assignments enable row level security;
alter table public.attempts    enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- profiles ------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_teacher(auth.uid()));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- courses -------------------------------------------------------------------
drop policy if exists courses_teacher_all on public.courses;
create policy courses_teacher_all on public.courses for all to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists courses_student_read on public.courses;
create policy courses_student_read on public.courses for select to authenticated
  using (exists (
    select 1 from public.enrollments e
    where e.course_id = courses.id and e.student_id = auth.uid()
  ));

-- enrollments ---------------------------------------------------------------
drop policy if exists enroll_teacher_all on public.enrollments;
create policy enroll_teacher_all on public.enrollments for all to authenticated
  using (public.owns_course(auth.uid(), course_id))
  with check (public.owns_course(auth.uid(), course_id));

drop policy if exists enroll_student_read on public.enrollments;
create policy enroll_student_read on public.enrollments for select to authenticated
  using (student_id = auth.uid());

-- modules -------------------------------------------------------------------
drop policy if exists modules_teacher_all on public.modules;
create policy modules_teacher_all on public.modules for all to authenticated
  using (public.owns_course(auth.uid(), course_id))
  with check (public.owns_course(auth.uid(), course_id));

drop policy if exists modules_student_read on public.modules;
create policy modules_student_read on public.modules for select to authenticated
  using (exists (
    select 1 from public.assignments a
    where a.module_id = modules.id and a.student_id = auth.uid()
  ));

-- questions -----------------------------------------------------------------
-- Sólo los profesores dueños del módulo. Los alumnos NUNCA leen esta tabla:
-- reciben preguntas saneadas a través de la Edge Function `exam`.
drop policy if exists questions_teacher_all on public.questions;
create policy questions_teacher_all on public.questions for all to authenticated
  using (public.owns_module(auth.uid(), module_id))
  with check (public.owns_module(auth.uid(), module_id));

-- assignments ---------------------------------------------------------------
drop policy if exists assign_teacher_all on public.assignments;
create policy assign_teacher_all on public.assignments for all to authenticated
  using (public.owns_module(auth.uid(), module_id))
  with check (public.owns_module(auth.uid(), module_id));

drop policy if exists assign_student_read on public.assignments;
create policy assign_student_read on public.assignments for select to authenticated
  using (student_id = auth.uid());

-- attempts ------------------------------------------------------------------
-- El alumno lee y actualiza (autoguardado) sus intentos; los campos de
-- corrección están protegidos por el trigger guard_attempt_fields.
drop policy if exists attempts_student_read on public.attempts;
create policy attempts_student_read on public.attempts for select to authenticated
  using (student_id = auth.uid() or public.owns_module(auth.uid(), module_id));

drop policy if exists attempts_student_update on public.attempts;
create policy attempts_student_update on public.attempts for update to authenticated
  using (student_id = auth.uid() and status = 'in_progress')
  with check (student_id = auth.uid());
