// ============================================================================
// Edge Function: exam
// El único componente que puede leer las respuestas correctas. Usa el rol de
// servicio para: (1) seleccionar N preguntas al azar por alumno y devolverlas
// SIN el índice correcto ni la explicación, y (2) corregir el intento en el
// servidor. Autentica al usuario con su JWT antes de cualquier operación.
//
// Acciones (POST { action, ... }):
//   - "start":  { assignment_id }            -> crea/recupera el intento y
//                                               devuelve las preguntas saneadas
//   - "submit": { attempt_id, answers }      -> corrige y devuelve el resultado
//                                               con las respuestas correctas
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) return json({ error: "No autenticado" }, 401);

  // Cliente con el JWT del usuario, sólo para identificarlo.
  const asUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await asUser.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "Sesión inválida" }, 401);
  const uid = userData.user.id;

  // Cliente con rol de servicio para las operaciones privilegiadas.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }
  const action = payload?.action;

  try {
    if (action === "start") return await start(admin, uid, payload);
    if (action === "submit") return await submit(admin, uid, payload);
    if (action === "review") return await review(admin, uid, payload);
    if (action === "resume") return await resume(admin, uid, payload);
    return json({ error: "Acción desconocida" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "Error interno", detail: String(e) }, 500);
  }
});

// ---------------------------------------------------------------------------
async function start(admin: any, uid: string, p: any) {
  const assignmentId = p.assignment_id;
  if (!assignmentId) return json({ error: "assignment_id requerido" }, 400);

  const { data: assignment } = await admin
    .from("assignments")
    .select("id, module_id, student_id, opens_at, closes_at")
    .eq("id", assignmentId)
    .single();

  if (!assignment) return json({ error: "Asignación no encontrada" }, 404);
  if (assignment.student_id !== uid) return json({ error: "No autorizado" }, 403);

  const now = Date.now();
  if (assignment.opens_at && now < new Date(assignment.opens_at).getTime())
    return json({ error: "La prueba aún no está disponible", opens_at: assignment.opens_at }, 403);
  if (assignment.closes_at && now > new Date(assignment.closes_at).getTime())
    return json({ error: "La ventana de la prueba ya cerró", closes_at: assignment.closes_at }, 403);

  const { data: module } = await admin
    .from("modules")
    .select("id, title, description, duration_minutes, questions_per_exam, passing_score, proctor_code, incident_action, max_incidents")
    .eq("id", assignment.module_id)
    .single();
  if (!module) return json({ error: "Módulo no encontrado" }, 404);

  // ¿Ya hay un intento? Se reanuda (mismas preguntas). Si está entregado, no.
  const { data: existing } = await admin
    .from("attempts")
    .select("*")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  let attempt = existing;

  if (attempt && attempt.status !== "in_progress") {
    return json({ error: "Esta prueba ya fue entregada", status: attempt.status }, 409);
  }

  if (!attempt) {
    // Selecciona N preguntas al azar del banco del módulo — únicas por alumno.
    const { data: bank } = await admin.from("questions").select("id").eq("module_id", module.id);
    if (!bank || bank.length === 0) return json({ error: "El módulo no tiene preguntas" }, 400);

    const n = Math.min(module.questions_per_exam, bank.length);
    const chosen = shuffle(bank.map((q: any) => q.id)).slice(0, n);

    const insert = {
      assignment_id: assignmentId,
      student_id: uid,
      module_id: module.id,
      question_ids: chosen,
      total: n,
      status: "in_progress",
    };
    const { data: created, error } = await admin.from("attempts").insert(insert).select("*").single();
    if (error) throw error;
    attempt = created;
  }

  // Devuelve las preguntas saneadas (sin correct_index ni explanation),
  // en el orden guardado del intento.
  const { data: qrows } = await admin
    .from("questions")
    .select("id, prompt, options")
    .in("id", attempt.question_ids);

  const byId = new Map(qrows.map((q: any) => [q.id, q]));
  const questions = attempt.question_ids
    .map((id: string) => byId.get(id))
    .filter(Boolean)
    .map((q: any) => ({ id: q.id, prompt: q.prompt, options: q.options }));

  // Config de seguridad SIN el código del profesor. Si la acción es 'lock' pero
  // no hay código configurado, se degrada a 'flag' para no dejar al alumno atascado.
  const hasCode = Boolean(module.proctor_code);
  let action = module.incident_action || "lock";
  if (action === "lock" && !hasCode) action = "flag";

  return json({
    attempt_id: attempt.id,
    status: attempt.status,
    started_at: attempt.started_at,
    duration_minutes: module.duration_minutes,
    closes_at: assignment.closes_at,
    module: { id: module.id, title: module.title, description: module.description, passing_score: module.passing_score },
    security: { action, max_incidents: module.max_incidents ?? 3, has_code: hasCode },
    answers: attempt.answers ?? {},
    questions,
  });
}

// ---------------------------------------------------------------------------
// Reanuda un examen congelado validando el código del profesor en el servidor.
async function resume(admin: any, uid: string, p: any) {
  const attemptId = p.attempt_id;
  const code = String(p.code ?? "");
  if (!attemptId) return json({ error: "attempt_id requerido" }, 400);

  const { data: attempt } = await admin.from("attempts").select("*").eq("id", attemptId).single();
  if (!attempt) return json({ error: "Intento no encontrado" }, 404);
  if (attempt.student_id !== uid) return json({ error: "No autorizado" }, 403);
  if (attempt.status !== "in_progress") return json({ error: "El intento ya no está activo" }, 409);

  const { data: module } = await admin
    .from("modules").select("proctor_code").eq("id", attempt.module_id).single();

  const ok = Boolean(module?.proctor_code) && code === String(module.proctor_code);

  const events = Array.isArray(attempt.security_events) ? attempt.security_events : [];
  events.push({ type: ok ? "resumed_by_proctor" : "resume_denied", at: new Date().toISOString() });
  await admin.from("attempts").update({ security_events: events }).eq("id", attemptId);

  return json({ ok });
}

// ---------------------------------------------------------------------------
async function submit(admin: any, uid: string, p: any) {
  const attemptId = p.attempt_id;
  const answers = p.answers ?? {};
  if (!attemptId) return json({ error: "attempt_id requerido" }, 400);

  const { data: attempt } = await admin.from("attempts").select("*").eq("id", attemptId).single();
  if (!attempt) return json({ error: "Intento no encontrado" }, 404);
  if (attempt.student_id !== uid) return json({ error: "No autorizado" }, 403);
  if (attempt.status !== "in_progress") return json({ error: "El intento ya no está activo" }, 409);

  const { data: module } = await admin
    .from("modules")
    .select("passing_score")
    .eq("id", attempt.module_id)
    .single();

  // Carga las preguntas CON su respuesta correcta para corregir.
  const { data: qrows } = await admin
    .from("questions")
    .select("id, prompt, options, correct_index, explanation")
    .in("id", attempt.question_ids);
  const byId = new Map(qrows.map((q: any) => [q.id, q]));

  let correct = 0;
  const review = attempt.question_ids.map((qid: string) => {
    const q: any = byId.get(qid);
    const chosen = answers[qid] ?? attempt.answers?.[qid] ?? null;
    const ok = q && chosen !== null && Number(chosen) === q.correct_index;
    if (ok) correct++;
    return {
      id: qid,
      prompt: q?.prompt,
      options: q?.options,
      correct_index: q?.correct_index,
      chosen: chosen === null ? -1 : Number(chosen),
      correct: ok,
      explanation: q?.explanation ?? null,
    };
  });

  const total = attempt.question_ids.length;
  const score = total ? Math.round((correct / total) * 100) : 0;

  const { error } = await admin
    .from("attempts")
    .update({
      answers,
      score,
      correct_count: correct,
      total,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptId);
  if (error) throw error;

  return json({
    attempt_id: attemptId,
    score,
    correct_count: correct,
    total,
    passing_score: module?.passing_score ?? 60,
    passed: score >= (module?.passing_score ?? 60),
    review,
  });
}

// ---------------------------------------------------------------------------
// Devuelve el detalle (con respuestas correctas) de un intento YA entregado.
async function review(admin: any, uid: string, p: any) {
  const attemptId = p.attempt_id;
  if (!attemptId) return json({ error: "attempt_id requerido" }, 400);

  const { data: attempt } = await admin.from("attempts").select("*").eq("id", attemptId).single();
  if (!attempt) return json({ error: "Intento no encontrado" }, 404);
  if (attempt.student_id !== uid) return json({ error: "No autorizado" }, 403);
  if (attempt.status !== "submitted") return json({ error: "El intento aún no fue entregado" }, 409);

  const { data: module } = await admin
    .from("modules").select("passing_score").eq("id", attempt.module_id).single();

  const { data: qrows } = await admin
    .from("questions")
    .select("id, prompt, options, correct_index, explanation")
    .in("id", attempt.question_ids);
  const byId = new Map(qrows.map((q: any) => [q.id, q]));

  const review = attempt.question_ids.map((qid: string) => {
    const q: any = byId.get(qid);
    const chosen = attempt.answers?.[qid] ?? null;
    return {
      id: qid,
      prompt: q?.prompt,
      options: q?.options,
      correct_index: q?.correct_index,
      chosen: chosen === null ? -1 : Number(chosen),
      correct: q && chosen !== null && Number(chosen) === q.correct_index,
      explanation: q?.explanation ?? null,
    };
  });

  return json({
    attempt_id: attemptId,
    score: attempt.score,
    correct_count: attempt.correct_count,
    total: attempt.total,
    passing_score: module?.passing_score ?? 60,
    passed: (attempt.score ?? 0) >= (module?.passing_score ?? 60),
    review,
  });
}
