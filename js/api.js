import { supabase } from "./lib/supabase.js";
import { session } from "./auth.js";

// Capa de acceso a datos. Todas las consultas pasan por RLS: cada usuario sólo
// ve lo que le corresponde. La entrega/corrección de exámenes va por la Edge
// Function `exam`.

const unwrap = ({ data, error }) => { if (error) throw error; return data; };

/* ----------------------------- Profesor: cursos ----------------------------- */
export const listMyCourses = () =>
  supabase.from("courses").select("*").order("created_at", { ascending: false }).then(unwrap);

export const getCourse = (id) =>
  supabase.from("courses").select("*").eq("id", id).single().then(unwrap);

export const createCourse = (name, description) =>
  supabase.from("courses").insert({ name, description, teacher_id: session.user.id })
    .select("*").single().then(unwrap);

export const updateCourse = (id, patch) =>
  supabase.from("courses").update(patch).eq("id", id).select("*").single().then(unwrap);

export const deleteCourse = (id) =>
  supabase.from("courses").delete().eq("id", id).then(unwrap);

/* ----------------------------- Matrículas ----------------------------- */
export const listEnrollments = (courseId) =>
  supabase.from("enrollments").select("*").eq("course_id", courseId)
    .order("student_username").then(unwrap);

export const addEnrollment = (courseId, username) =>
  supabase.from("enrollments").insert({ course_id: courseId, student_username: String(username).trim().toLowerCase() })
    .select("*").single().then(unwrap);

export const removeEnrollment = (id) =>
  supabase.from("enrollments").delete().eq("id", id).then(unwrap);

/* ----------------------------- Módulos ----------------------------- */
export const listModules = (courseId) =>
  supabase.from("modules").select("*").eq("course_id", courseId)
    .order("created_at", { ascending: false }).then(unwrap);

export const getModule = (id) =>
  supabase.from("modules").select("*").eq("id", id).single().then(unwrap);

export const createModule = (courseId, m) =>
  supabase.from("modules").insert({ course_id: courseId, ...m }).select("*").single().then(unwrap);

export const updateModule = (id, patch) =>
  supabase.from("modules").update(patch).eq("id", id).select("*").single().then(unwrap);

export const deleteModule = (id) =>
  supabase.from("modules").delete().eq("id", id).then(unwrap);

/* ----------------------------- Banco de preguntas ----------------------------- */
export const listQuestions = (moduleId) =>
  supabase.from("questions").select("*").eq("module_id", moduleId)
    .order("created_at", { ascending: true }).then(unwrap);

export const countQuestions = (moduleId) =>
  supabase.from("questions").select("id", { count: "exact", head: true })
    .eq("module_id", moduleId).then(({ count, error }) => { if (error) throw error; return count || 0; });

export const createQuestion = (moduleId, q) =>
  supabase.from("questions").insert({ module_id: moduleId, ...q }).select("*").single().then(unwrap);

export const createQuestionsBulk = (moduleId, rows) =>
  supabase.from("questions").insert(rows.map((q) => ({ module_id: moduleId, ...q })))
    .select("id").then(unwrap);

export const deleteQuestion = (id) =>
  supabase.from("questions").delete().eq("id", id).then(unwrap);

/* ----------------------------- Asignaciones ----------------------------- */
export const listAssignmentsForModule = (moduleId) =>
  supabase.from("assignments").select("*").eq("module_id", moduleId).then(unwrap);

export const assignModule = (moduleId, studentId, opensAt, closesAt) =>
  supabase.from("assignments")
    .upsert({ module_id: moduleId, student_id: studentId, opens_at: opensAt, closes_at: closesAt },
            { onConflict: "module_id,student_id" })
    .select("*").single().then(unwrap);

export const unassignModule = (id) =>
  supabase.from("assignments").delete().eq("id", id).then(unwrap);

// Resultados de un módulo para el profesor (con datos del alumno y el intento).
export const moduleResults = async (moduleId) => {
  const assigns = await supabase.from("assignments")
    .select("*, profiles!assignments_student_id_fkey(full_name,username)")
    .eq("module_id", moduleId).then(unwrap);
  const attempts = await supabase.from("attempts").select("*").eq("module_id", moduleId).then(unwrap);
  const byAssign = new Map(attempts.map((a) => [a.assignment_id, a]));
  return assigns.map((a) => ({ assignment: a, attempt: byAssign.get(a.id) || null }));
};

/* ----------------------------- Admin: gestión de usuarios ----------------------------- */
// Lista todos los perfiles (solo visible para admin por RLS: profiles_admin_all).
export const listAllProfiles = () =>
  supabase.from("profiles").select("id, username, full_name, role, must_change_password, created_at")
    .order("role").order("username").then(unwrap);

// Cambia el rol de un usuario vía la RPC (SECURITY DEFINER): solo un admin
// puede, y no se puede quitar el último admin. La seguridad real la impone
// la base de datos; esto es solo la puerta desde la UI.
export const adminSetRole = (targetUser, newRole) =>
  supabase.rpc("admin_set_role", { target_user: targetUser, new_role: newRole })
    .then(({ error }) => { if (error) throw error; });

// Crea una cuenta (usuario + clave + rol) vía la Edge Function `admin-users`
// (rol de servicio; requiere que quien llama sea admin).
export const adminCreateUser = (username, password, fullName, role) =>
  supabase.functions.invoke("admin-users", { body: { action: "create", username, password, full_name: fullName, role } })
    .then(({ data, error }) => { if (error) throw error; if (data?.error) throw new Error(data.error); return data; });

// Restablece la clave de un usuario (fuerza cambio en el próximo ingreso).
export const adminResetPassword = (userId, password) =>
  supabase.functions.invoke("admin-users", { body: { action: "reset_password", user_id: userId, password } })
    .then(({ data, error }) => { if (error) throw error; if (data?.error) throw new Error(data.error); return data; });

/* ----------------------------- Alumno ----------------------------- */
// Exámenes asignados al alumno actual, con módulo, curso e intento.
export const myAssignments = async () => {
  const assigns = await supabase.from("assignments")
    .select("*, modules(*, courses(name))")
    .eq("student_id", session.user.id)
    .order("created_at", { ascending: false }).then(unwrap);

  const attempts = await supabase.from("attempts")
    .select("id, assignment_id, status, score, submitted_at")
    .eq("student_id", session.user.id).then(unwrap);
  const byAssign = new Map(attempts.map((a) => [a.assignment_id, a]));

  return assigns.map((a) => ({ ...a, attempt: byAssign.get(a.id) || null }));
};

export const myCourses = () =>
  supabase.from("enrollments").select("*, courses(*)").eq("student_id", session.user.id).then(unwrap);

/* ----------------------------- Examen (Edge Function) ----------------------------- */
export const startExam = (assignmentId) =>
  supabase.functions.invoke("exam", { body: { action: "start", assignment_id: assignmentId } })
    .then(({ data, error }) => { if (error) throw error; if (data?.error) throw new Error(data.error); return data; });

export const submitExam = (attemptId, answers) =>
  supabase.functions.invoke("exam", { body: { action: "submit", attempt_id: attemptId, answers } })
    .then(({ data, error }) => { if (error) throw error; if (data?.error) throw new Error(data.error); return data; });

export const reviewExam = (attemptId) =>
  supabase.functions.invoke("exam", { body: { action: "review", attempt_id: attemptId } })
    .then(({ data, error }) => { if (error) throw error; if (data?.error) throw new Error(data.error); return data; });

// Reanuda un examen congelado; el código del profesor se valida en el servidor.
export const resumeExam = (attemptId, code) =>
  supabase.functions.invoke("exam", { body: { action: "resume", attempt_id: attemptId, code } })
    .then(({ data, error }) => { if (error) throw error; if (data?.error) throw new Error(data.error); return Boolean(data?.ok); });

// Autoguardado de respuestas y eventos de seguridad (columnas permitidas por RLS).
export const saveProgress = (attemptId, answers, securityEvents) =>
  supabase.from("attempts").update({ answers, security_events: securityEvents })
    .eq("id", attemptId).then(({ error }) => { if (error) throw error; });
