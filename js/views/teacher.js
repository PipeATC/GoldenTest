import { I, esc, toast, modal, $, $$, formatDur, fmtDate, windowState } from "../ui.js";
import { render } from "../render.js";
import { session } from "../auth.js";
import { supabase } from "../lib/supabase.js";
import * as api from "../api.js";

// Ciclo de vida del monitor en vivo (canal Realtime + sondeo de respaldo).
let monitorChannel = null;
let monitorTimer = null;
function stopMonitor() {
  if (monitorChannel) { try { supabase.removeChannel(monitorChannel); } catch {} monitorChannel = null; }
  if (monitorTimer) { clearInterval(monitorTimer); monitorTimer = null; }
}

const errorBox = (e) => `<div class="empty"><h2>Ocurrió un problema</h2><p>${esc(e.message || e)}</p></div>`;
const securityLabel = (a) => ({ lock: "Congelar (código profesor)", flag: "Solo registrar", submit: "Autoentregar" }[a] || "Congelar (código profesor)");
const toISO = (localVal) => (localVal ? new Date(localVal).toISOString() : null);
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso); const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/* ============================== Panel ============================== */
export async function teacherDashboard() {
  render("inicio", "Panel del profesor", `<div class="empty">Cargando…</div>`);
  let courses = [];
  try { courses = await api.listMyCourses(); } catch (e) { return render("inicio", "Panel", errorBox(e)); }
  const first = (session.profile?.full_name || "").split(" ")[0] || "profesor";

  const html = `
    <section class="hero">
      <div><h1>Hola, ${esc(first)}</h1><p>Gestiona tus cursos, módulos y pruebas desde aquí.</p></div>
      <button class="btn btn-gold" id="newCourseBtn">${I.plus} Nuevo curso</button>
    </section>

    <div class="stats">
      <div class="stat"><div class="stat-top"><span class="stat-label">Cursos</span><span class="stat-emblem navy">${I.courses}</span></div><div class="stat-value">${courses.length}</div></div>
    </div>

    <div class="section-head"><h2>Tus cursos</h2><a class="link-more" href="#/cursos">Ver todos ${I.arrowRight}</a></div>
    <div class="exam-cards" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
      ${courses.length ? courses.map(courseCard).join("") : `<div class="empty">Aún no tienes cursos. Crea el primero.</div>`}
    </div>`;
  render("inicio", "Panel del profesor", html);
  $("#newCourseBtn").onclick = promptNewCourse;
}

export async function teacherCourses() {
  render("cursos", "Cursos", `<div class="empty">Cargando…</div>`);
  let courses = [];
  try { courses = await api.listMyCourses(); } catch (e) { return render("cursos", "Cursos", errorBox(e)); }
  const html = `
    <div class="page-head"><h1>Cursos</h1><p>Administra tus cursos, sus alumnos y módulos.</p></div>
    <div style="margin:16px 0"><button class="btn btn-primary" id="newCourseBtn">${I.plus} Nuevo curso</button></div>
    <div class="exam-cards" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
      ${courses.length ? courses.map(courseCard).join("") : `<div class="empty">Aún no tienes cursos.</div>`}
    </div>`;
  render("cursos", "Cursos", html);
  $("#newCourseBtn").onclick = promptNewCourse;
}

function courseCard(c) {
  return `
    <div class="exam-card">
      <div class="ec-top"><span class="badge badge-navy">Curso</span></div>
      <h3>${esc(c.name)}</h3>
      <p class="ec-desc">${esc(c.description || "Sin descripción")}</p>
      <a class="btn btn-primary btn-block" href="#/curso/${c.id}">Abrir ${I.arrowRight}</a>
    </div>`;
}

async function promptNewCourse() {
  const ok = await modal({
    title: "Nuevo curso",
    body: `<label class="fld">Nombre<input id="c_name" type="text" placeholder="p.ej. Inglés Aeronáutico 2026"></label>
           <label class="fld">Descripción<textarea id="c_desc" rows="3"></textarea></label>`,
    confirmLabel: "Crear",
  });
  if (!ok) return;
  const name = $("#c_name")?.value.trim();
  if (!name) return;
  try { const c = await api.createCourse(name, $("#c_desc")?.value.trim()); location.hash = "#/curso/" + c.id; }
  catch (e) { toast("Error: " + e.message); }
}

/* ============================== Detalle de curso ============================== */
export async function teacherCourseDetail(courseId) {
  render("cursos", "Curso", `<div class="empty">Cargando…</div>`);
  let course, enrollments, modules;
  try {
    [course, enrollments, modules] = await Promise.all([
      api.getCourse(courseId), api.listEnrollments(courseId), api.listModules(courseId),
    ]);
  } catch (e) { return render("cursos", "Curso", errorBox(e)); }

  const html = `
    <div class="page-head with-back">
      <a class="back-link" href="#/cursos">${I.arrowLeft} Cursos</a>
      <h1>${esc(course.name)}</h1>
      <p>${esc(course.description || "")}</p>
    </div>

    <div class="two-col">
      <section class="panel">
        <div class="panel-head"><h2>${I.users} Alumnos <span class="count">${enrollments.length}</span></h2></div>
        <form id="enrollForm" class="inline-form">
          <input type="text" id="enrollUsername" placeholder="usuario del alumno" autocapitalize="none" spellcheck="false" required>
          <button class="btn btn-primary" type="submit">${I.plus} Añadir</button>
        </form>
        <div class="list">
          ${enrollments.length ? enrollments.map((e) => `
            <div class="list-row">
              <div><b>@${esc(e.student_username || e.student_email || "")}</b><span class="sub">${e.student_id ? "Registrado" : "Pendiente de registro"}</span></div>
              <button class="icon-btn danger" data-del-enroll="${e.id}" title="Quitar">${I.trash}</button>
            </div>`).join("") : `<div class="empty small">Aún no hay alumnos. Añádelos por su nombre de usuario.</div>`}
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>${I.exams} Módulos / Pruebas <span class="count">${modules.length}</span></h2>
          <button class="btn btn-primary sm" id="newModuleBtn">${I.plus} Nuevo</button></div>
        <div class="list">
          ${modules.length ? modules.map((m) => `
            <div class="list-row">
              <div><b>${esc(m.title)}</b><span class="sub">${formatDur(m.duration_minutes)} · ${m.questions_per_exam} preguntas al azar · corte ${m.passing_score}%</span></div>
              <a class="btn btn-ghost sm" href="#/modulo/${m.id}">Gestionar ${I.arrowRight}</a>
            </div>`).join("") : `<div class="empty small">Aún no hay módulos.</div>`}
        </div>
      </section>
    </div>`;
  render("cursos", "Curso", html);

  $("#enrollForm").onsubmit = async (ev) => {
    ev.preventDefault();
    const username = $("#enrollUsername").value.trim();
    if (!username) return;
    try { await api.addEnrollment(courseId, username); teacherCourseDetail(courseId); }
    catch (e) { toast(e.message.includes("duplicate") ? "Ese alumno ya está en el curso." : "Error: " + e.message); }
  };
  $$("[data-del-enroll]").forEach((b) => b.onclick = async () => {
    if (!(await modal({ title: "Quitar alumno", body: "<p>¿Quitar a este alumno del curso?</p>", confirmLabel: "Quitar", danger: true }))) return;
    await api.removeEnrollment(b.dataset.delEnroll); teacherCourseDetail(courseId);
  });
  $("#newModuleBtn").onclick = () => promptNewModule(courseId);
}

async function promptNewModule(courseId) {
  const ok = await modal({
    title: "Nuevo módulo / prueba",
    body: moduleFormBody(),
    confirmLabel: "Crear",
  });
  if (!ok) return;
  const payload = readModuleForm();
  if (!payload) return;
  try {
    const m = await api.createModule(courseId, payload);
    location.hash = "#/modulo/" + m.id;
  } catch (e) { toast("Error: " + e.message); }
}

// Formulario reutilizable para crear/editar módulo (con config de seguridad).
function moduleFormBody(m) {
  m = m || {};
  const action = m.incident_action || "lock";
  const opt = (v, label) => `<option value="${v}" ${action === v ? "selected" : ""}>${label}</option>`;
  return `
    <label class="fld">Título<input id="m_title" type="text" placeholder="p.ej. Aviation 101" value="${esc(m.title || "")}"></label>
    <label class="fld">Descripción<textarea id="m_desc" rows="2">${esc(m.description || "")}</textarea></label>
    <div class="grid3">
      <label class="fld">Duración (min)<input id="m_dur" type="number" value="${m.duration_minutes ?? 60}" min="1"></label>
      <label class="fld">Preguntas al azar<input id="m_qpe" type="number" value="${m.questions_per_exam ?? 50}" min="1"></label>
      <label class="fld">Nota de corte (%)<input id="m_pass" type="number" value="${m.passing_score ?? 60}" min="0" max="100"></label>
    </div>
    <div class="note"><span>${I.shield}</span><div><b>Seguridad durante el examen</b><p class="hint" style="margin-top:2px">Qué ocurre si el alumno sale de la prueba.</p></div></div>
    <div class="grid3">
      <label class="fld">Acción ante salida
        <select id="m_action">
          ${opt("lock", "Congelar (código profesor)")}
          ${opt("flag", "Solo registrar")}
          ${opt("submit", "Autoentregar")}
        </select>
      </label>
      <label class="fld">Código del profesor<input id="m_code" type="text" inputmode="numeric" placeholder="p.ej. 4821" value="${esc(m.proctor_code || "")}"></label>
      <label class="fld">Máx. salidas (autoentrega)<input id="m_maxinc" type="number" value="${m.max_incidents ?? 3}" min="1"></label>
    </div>
    <p class="hint">“Congelar” pausa el examen hasta que el profesor ingrese el código (validado en el servidor). Si eliges “Congelar”, define un código.</p>`;
}

function readModuleForm() {
  const title = $("#m_title")?.value.trim();
  if (!title) { toast("El título es obligatorio."); return null; }
  const action = $("#m_action")?.value || "lock";
  const code = $("#m_code")?.value.trim() || null;
  if (action === "lock" && !code) { toast("Para “Congelar” debes definir un código del profesor."); return null; }
  return {
    title,
    description: $("#m_desc")?.value.trim() || null,
    duration_minutes: Number($("#m_dur").value) || 60,
    questions_per_exam: Number($("#m_qpe").value) || 50,
    passing_score: Number($("#m_pass").value) || 60,
    incident_action: action,
    proctor_code: code,
    max_incidents: Number($("#m_maxinc").value) || 3,
  };
}

/* ============================== Detalle de módulo ============================== */
let moduleTab = "preguntas";
export async function teacherModuleDetail(moduleId) {
  stopMonitor();
  render("cursos", "Módulo", `<div class="empty">Cargando…</div>`);
  let module, questions, course, enrollments, assignments;
  try {
    module = await api.getModule(moduleId);
    [questions, course] = await Promise.all([api.listQuestions(moduleId), api.getCourse(module.course_id)]);
    [enrollments, assignments] = await Promise.all([api.listEnrollments(module.course_id), api.listAssignmentsForModule(moduleId)]);
  } catch (e) { return render("cursos", "Módulo", errorBox(e)); }

  const tabs = [
    { key: "preguntas", label: `Banco de preguntas (${questions.length})` },
    { key: "asignar", label: "Asignar y bloque horario" },
    { key: "monitor", label: "Monitor en vivo" },
    { key: "resultados", label: "Resultados" },
  ];

  const html = `
    <div class="page-head with-back">
      <a class="back-link" href="#/curso/${module.course_id}">${I.arrowLeft} ${esc(course.name)}</a>
      <div class="head-row">
        <h1>${esc(module.title)}</h1>
        <button class="btn btn-ghost sm" id="editModuleBtn">${I.edit} Editar</button>
      </div>
      <p>${formatDur(module.duration_minutes)} · ${module.questions_per_exam} preguntas al azar de ${questions.length} · corte ${module.passing_score}%</p>
      <p class="hint">${I.shield} Seguridad: <b>${securityLabel(module.incident_action)}</b>${module.incident_action === "lock" ? (module.proctor_code ? " · código configurado" : ` · <span style="color:var(--error)">falta código</span>`) : ""}</p>
    </div>
    <div class="tabs">
      ${tabs.map((t) => `<button class="tab ${moduleTab === t.key ? "active" : ""}" data-tab="${t.key}">${t.label}</button>`).join("")}
    </div>
    <div id="tabBody"></div>`;
  render("cursos", "Módulo", html);

  $$("[data-tab]").forEach((b) => b.onclick = () => { moduleTab = b.dataset.tab; drawTab(); });
  $("#editModuleBtn").onclick = async () => {
    const ok = await modal({ title: "Editar módulo", body: moduleFormBody(module), confirmLabel: "Guardar" });
    if (!ok) return;
    const payload = readModuleForm();
    if (!payload) return;
    try { await api.updateModule(moduleId, payload); teacherModuleDetail(moduleId); }
    catch (e) { toast("Error: " + e.message); }
  };
  const drawTab = () => {
    stopMonitor();  // detener el monitor al cambiar de pestaña
    $$("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === moduleTab));
    const body = $("#tabBody");
    if (moduleTab === "preguntas") tabQuestions(body, module, questions, () => teacherModuleDetail(moduleId));
    else if (moduleTab === "asignar") tabAssign(body, module, enrollments, assignments, () => teacherModuleDetail(moduleId));
    else if (moduleTab === "monitor") tabMonitor(body, module);
    else tabResults(body, module);
  };
  drawTab();
}

/* ---------- Tab: banco de preguntas ---------- */
function tabQuestions(body, module, questions, reload) {
  const warn = questions.length < module.questions_per_exam
    ? `<div class="note warn">${I.info} El banco tiene ${questions.length} preguntas pero el módulo asigna ${module.questions_per_exam}. Se usarán ${questions.length}. Agrega más para que sean realmente al azar.</div>` : "";

  body.innerHTML = `
    ${warn}
    <div class="panel-head"><h2>Preguntas</h2>
      <div class="btn-row">
        <button class="btn btn-ghost sm" id="bulkBtn">${I.plus} Importar en lote</button>
        <button class="btn btn-primary sm" id="addQBtn">${I.plus} Añadir pregunta</button>
      </div>
    </div>
    <div class="q-list">
      ${questions.length ? questions.map((q, i) => `
        <div class="q-item">
          <div class="q-item-main">
            <span class="q-idx">${i + 1}</span>
            <div>
              <b>${esc(q.prompt)}</b>
              <div class="q-opts">${(q.options || []).map((o, oi) => `<span class="${oi === q.correct_index ? "ok" : ""}">${esc(String.fromCharCode(65 + oi))}) ${esc(o)}</span>`).join("")}</div>
            </div>
          </div>
          <button class="icon-btn danger" data-del-q="${q.id}" title="Eliminar">${I.trash}</button>
        </div>`).join("") : `<div class="empty small">El banco está vacío. Añade o importa preguntas.</div>`}
    </div>`;

  $("#addQBtn").onclick = () => promptQuestion(module.id, reload);
  $("#bulkBtn").onclick = () => promptBulk(module.id, reload);
  $$("[data-del-q]").forEach((b) => b.onclick = async () => {
    if (!(await modal({ title: "Eliminar pregunta", body: "<p>¿Eliminar esta pregunta del banco?</p>", confirmLabel: "Eliminar", danger: true }))) return;
    await api.deleteQuestion(b.dataset.delQ); reload();
  });
}

async function promptQuestion(moduleId, reload) {
  const ok = await modal({
    title: "Nueva pregunta",
    body: `
      <label class="fld">Enunciado<textarea id="q_prompt" rows="2"></textarea></label>
      <div id="optWrap">
        ${[0, 1, 2, 3].map((i) => `
          <label class="fld opt-fld"><input type="radio" name="correct" value="${i}" ${i === 0 ? "checked" : ""}>
            <input type="text" class="q_opt" placeholder="Opción ${String.fromCharCode(65 + i)}"></label>`).join("")}
      </div>
      <p class="hint">Marca el círculo de la opción correcta.</p>
      <label class="fld">Explicación (opcional)<textarea id="q_expl" rows="2"></textarea></label>`,
    confirmLabel: "Guardar",
  });
  if (!ok) return;
  const prompt = $("#q_prompt")?.value.trim();
  const options = $$(".q_opt").map((i) => i.value.trim()).filter(Boolean);
  const correct = Number(document.querySelector("input[name=correct]:checked")?.value ?? 0);
  if (!prompt || options.length < 2) return toast("Escribe el enunciado y al menos 2 opciones.");
  try {
    await api.createQuestion(moduleId, { prompt, options, correct_index: correct, explanation: $("#q_expl")?.value.trim() || null });
    reload();
  } catch (e) { toast("Error: " + e.message); }
}

async function promptBulk(moduleId, reload) {
  const ok = await modal({
    title: "Importar preguntas en lote",
    body: `
      <p class="hint">Pega <b>JSON</b> (array de objetos) o <b>CSV</b> con formato:<br>
      <code>enunciado | opción A | opción B | opción C | opción D | índiceCorrecto(0-based) | explicación</code></p>
      <textarea id="bulk_text" rows="10" placeholder='[{"prompt":"...","options":["A","B"],"correct_index":0,"explanation":"..."}]
o bien:
¿Capital? | Santiago | Lima | Quito | Bogotá | 0 | Es Santiago'></textarea>`,
    confirmLabel: "Importar",
  });
  if (!ok) return;
  const raw = $("#bulk_text")?.value.trim();
  if (!raw) return;
  let rows;
  try { rows = parseBulk(raw); }
  catch (e) { return toast("No se pudo interpretar: " + e.message); }
  if (!rows.length) return toast("No se encontraron preguntas válidas.");
  try { await api.createQuestionsBulk(moduleId, rows); toast(`${rows.length} pregunta(s) importada(s).`); reload(); }
  catch (e) { toast("Error al importar: " + e.message); }
}

function parseBulk(raw) {
  if (raw[0] === "[" || raw[0] === "{") {
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : [data];
    return arr.map((o) => ({
      prompt: String(o.prompt || o.enunciado || "").trim(),
      options: (o.options || o.opciones || []).map(String),
      correct_index: Number(o.correct_index ?? o.correcta ?? 0),
      explanation: o.explanation || o.explicacion || null,
    })).filter((q) => q.prompt && q.options.length >= 2);
  }
  // CSV por líneas con separador "|"
  return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = line.split("|").map((p) => p.trim());
    const prompt = parts.shift();
    const explanation = parts.length > 3 ? parts.pop() : null;
    const correct_index = Number(parts.pop() || 0);
    const options = parts.filter(Boolean);
    return { prompt, options, correct_index, explanation };
  }).filter((q) => q.prompt && q.options.length >= 2);
}

/* ---------- Tab: asignar + bloque horario ---------- */
function tabAssign(body, module, enrollments, assignments, reload) {
  const byStudent = new Map(assignments.map((a) => [a.student_id, a]));
  const registered = enrollments.filter((e) => e.student_id);
  const pending = enrollments.filter((e) => !e.student_id);

  body.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h2>${I.clock} Bloque horario</h2></div>
      <p class="hint">Define la ventana en la que los alumnos podrán rendir. Puedes dejar “apertura” vacía para disponibilidad inmediata.</p>
      <div class="grid2">
        <label class="fld">Apertura<input type="datetime-local" id="opens"></label>
        <label class="fld">Cierre<input type="datetime-local" id="closes"></label>
      </div>
      <button class="btn btn-gold" id="assignAll">${I.check} Activar para todos los alumnos registrados (${registered.length})</button>
    </div>

    <div class="panel">
      <div class="panel-head"><h2>${I.users} Alumnos</h2></div>
      ${pending.length ? `<div class="note warn">${I.info} ${pending.length} alumno(s) aún no se registran; no se les puede asignar hasta que inicien sesión.</div>` : ""}
      <div class="list">
        ${registered.length ? registered.map((e) => {
          const a = byStudent.get(e.student_id);
          const st = a ? windowState(a.opens_at, a.closes_at) : null;
          const stLabel = a ? { open: "Disponible", upcoming: "Programada", closed: "Cerrada" }[st] : "Sin asignar";
          return `
            <div class="list-row">
              <div><b>@${esc(e.student_username || e.student_email || "")}</b><span class="sub">${a ? `${stLabel}${a.closes_at ? " · cierra " + fmtDate(a.closes_at) : ""}` : "Sin asignar"}</span></div>
              <div class="btn-row">
                <button class="btn btn-ghost sm" data-assign="${e.student_id}">${a ? "Actualizar" : "Asignar"}</button>
                ${a ? `<button class="icon-btn danger" data-unassign="${a.id}" title="Quitar asignación">${I.trash}</button>` : ""}
              </div>
            </div>`;
        }).join("") : `<div class="empty small">No hay alumnos registrados en el curso.</div>`}
      </div>
    </div>`;

  const getWindow = () => [toISO($("#opens").value), toISO($("#closes").value)];

  $("#assignAll").onclick = async () => {
    const [o, c] = getWindow();
    try {
      for (const e of registered) await api.assignModule(module.id, e.student_id, o, c);
      toast(`Activado para ${registered.length} alumno(s).`); reload();
    } catch (err) { toast("Error: " + err.message); }
  };
  $$("[data-assign]").forEach((b) => b.onclick = async () => {
    const [o, c] = getWindow();
    try { await api.assignModule(module.id, b.dataset.assign, o, c); toast("Asignado."); reload(); }
    catch (err) { toast("Error: " + err.message); }
  });
  $$("[data-unassign]").forEach((b) => b.onclick = async () => {
    await api.unassignModule(b.dataset.unassign); reload();
  });
}

/* ---------- Tab: resultados ---------- */
async function tabResults(body, module) {
  body.innerHTML = `<div class="empty small">Cargando resultados…</div>`;
  let rows;
  try { rows = await api.moduleResults(module.id); } catch (e) { body.innerHTML = errorBox(e); return; }
  const done = rows.filter((r) => r.attempt && r.attempt.status === "submitted");
  const avg = done.length ? Math.round(done.reduce((s, r) => s + (r.attempt.score || 0), 0) / done.length) : null;

  body.innerHTML = `
    <div class="stats">
      <div class="stat"><div class="stat-top"><span class="stat-label">Asignados</span></div><div class="stat-value">${rows.length}</div></div>
      <div class="stat"><div class="stat-top"><span class="stat-label">Entregados</span></div><div class="stat-value">${done.length}</div></div>
      <div class="stat dark"><div class="stat-top"><span class="stat-label">Promedio</span></div><div class="stat-value">${avg == null ? "—" : avg + " <small>%</small>"}</div></div>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Alumno</th><th>Estado</th><th>Puntaje</th><th>Incidencias</th><th>Entregado</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map((r) => {
            const p = r.assignment.profiles || {};
            const at = r.attempt;
            const sec = at ? (at.security_events || []).filter((e) => ["blur", "fullscreen_exit", "window_blur"].includes(e.type)).length : 0;
            const statusLabel = !at ? "No iniciada" : at.status === "submitted" ? "Entregada" : "En curso";
            return `<tr>
              <td>${esc(p.full_name || (p.username ? "@" + p.username : "") || "—")}</td>
              <td><span class="status-pill ${at?.status === "submitted" ? "open" : "upcoming"}">${statusLabel}</span></td>
              <td>${at?.score != null ? at.score + "%" : "—"}</td>
              <td>${at ? (sec ? `<span class="warn-count">${sec}</span>` : "0") : "—"}</td>
              <td>${at?.submitted_at ? fmtDate(at.submitted_at) : "—"}</td>
            </tr>`;
          }).join("") : `<tr><td colspan="5" class="empty small">Sin asignaciones.</td></tr>`}
        </tbody>
      </table>
    </div>`;
}

/* ---------- Tab: monitor en vivo ---------- */
const EV_LABELS = {
  blur: "Cambió de app/pestaña", window_blur: "Perdió el foco", fullscreen_exit: "Salió de pantalla completa",
  unload_attempt: "Intentó recargar/cerrar", back_blocked: "Intentó retroceder",
  shortcut_blocked: "Atajo bloqueado", resumed_by_proctor: "Reanudado por profesor",
  resume_denied: "Código incorrecto", exam_started: "Inició la prueba",
};

// Analiza los eventos de seguridad de un intento.
function analyzeSec(at, action) {
  if (!at) return { incidents: 0, awaiting: false, last: null };
  const evs = Array.isArray(at.security_events) ? at.security_events : [];
  const incTypes = ["blur", "window_blur", "fullscreen_exit"];
  const incidents = evs.filter((e) => incTypes.includes(e.type)).length;
  const resumes = evs.filter((e) => e.type === "resumed_by_proctor").length;
  const awaiting = action === "lock" && at.status === "in_progress" && incidents > resumes;
  return { incidents, awaiting, last: evs[evs.length - 1] || null };
}

async function tabMonitor(body, module) {
  stopMonitor();
  body.innerHTML = `<div class="empty small">Cargando monitor…</div>`;
  const state = new Map();  // assignment_id -> { row, prevInc }

  const load = async () => {
    let rows;
    try { rows = await api.moduleResults(module.id); } catch (e) { body.innerHTML = errorBox(e); return; }
    rows.forEach((r) => {
      const prev = state.get(r.assignment.id);
      state.set(r.assignment.id, { row: r, prevInc: prev ? prev.prevInc : 0 });
    });
    renderMonitor(body, module, state);
  };

  await load();

  // Suscripción en tiempo real a los cambios de intentos de este módulo.
  try {
    monitorChannel = supabase
      .channel(`monitor-${module.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "attempts", filter: `module_id=eq.${module.id}` },
        (payload) => {
          const row = payload.new;
          if (!row || !row.assignment_id) return;
          const entry = state.get(row.assignment_id);
          if (entry) { entry.row.attempt = row; renderMonitor(body, module, state); }
          else { load(); }  // intento nuevo: recarga para traer el perfil
        })
      .subscribe();
  } catch { /* si Realtime no está habilitado, queda el sondeo */ }

  // Respaldo por sondeo (por si Realtime no está habilitado en la tabla).
  monitorTimer = setInterval(load, 15000);

  // Detener el monitor al navegar fuera del módulo.
  const onHash = () => { stopMonitor(); window.removeEventListener("hashchange", onHash); };
  window.addEventListener("hashchange", onHash);
}

function renderMonitor(body, module, state) {
  const entries = [...state.values()];
  const rindiendo = entries.filter((e) => e.row.attempt?.status === "in_progress").length;
  const entregadas = entries.filter((e) => e.row.attempt?.status === "submitted").length;
  const alertas = entries.filter((e) => analyzeSec(e.row.attempt, module.incident_action).awaiting).length;

  body.innerHTML = `
    <div class="monitor-head">
      <div class="mon-stat"><span>${entries.length}</span>asignados</div>
      <div class="mon-stat live"><span>${rindiendo}</span>rindiendo</div>
      <div class="mon-stat ${alertas ? "alert" : ""}"><span>${alertas}</span>en pausa / alerta</div>
      <div class="mon-stat"><span>${entregadas}</span>entregadas</div>
      <div class="mon-live">${I.shield} En vivo</div>
    </div>
    ${alertas ? `<div class="note warn">${I.info} Hay <b>${alertas}</b> alumno(s) en pausa esperando tu código para reanudar.</div>` : ""}
    <div class="table-wrap">
      <table class="data-table monitor-table">
        <thead><tr><th>Alumno</th><th>Estado</th><th>Progreso</th><th>Incidencias</th><th>Última actividad</th></tr></thead>
        <tbody>${entries.map((e) => monitorRow(e, module)).join("")}</tbody>
      </table>
    </div>
    <p class="hint" style="margin-top:12px">Se actualiza en tiempo real. Si no ves cambios, habilita Realtime para la tabla <code>attempts</code> (ver SETUP.md); igual se refresca cada 15 s.</p>`;
}

function monitorRow(e, module) {
  const p = e.row.assignment.profiles || {};
  const at = e.row.attempt;
  const a = analyzeSec(at, module.incident_action);
  const flash = at && a.incidents > e.prevInc;
  e.prevInc = a.incidents;

  let status, cls;
  if (!at) { status = "No iniciada"; cls = "closed"; }
  else if (at.status === "submitted") { status = `Entregada (${at.score}%)`; cls = "open"; }
  else if (a.awaiting) { status = "⏸ En pausa"; cls = "paused"; }
  else { status = "● Rindiendo"; cls = "live"; }

  const answered = at ? Object.keys(at.answers || {}).length : 0;
  const total = at?.total || module.questions_per_exam;
  const progress = at ? `${answered}/${total}` : "—";
  const lastLabel = a.last ? (EV_LABELS[a.last.type] || a.last.type) : "—";
  const lastWhen = a.last ? fmtDate(a.last.at) : "";

  return `
    <tr class="${flash ? "row-flash" : ""} ${a.awaiting ? "row-alert" : ""}">
      <td>${esc(p.full_name || (p.username ? "@" + p.username : "") || "—")}</td>
      <td><span class="status-pill ${cls}">${status}</span></td>
      <td>${progress}</td>
      <td>${at ? (a.incidents ? `<span class="warn-count">${a.incidents}</span>` : "0") : "—"}</td>
      <td>${lastLabel}${lastWhen ? `<span class="sub">${lastWhen}</span>` : ""}</td>
    </tr>`;
}

/* ============================== Resultados (global) ============================== */
export async function teacherResults() {
  render("resultados", "Resultados", `<div class="empty">Cargando…</div>`);
  let courses = [];
  try { courses = await api.listMyCourses(); } catch (e) { return render("resultados", "Resultados", errorBox(e)); }
  // Lista módulos por curso para navegar a sus resultados.
  const blocks = await Promise.all(courses.map(async (c) => {
    const mods = await api.listModules(c.id).catch(() => []);
    return { c, mods };
  }));
  const html = `
    <div class="page-head"><h1>Resultados</h1><p>Selecciona un módulo para ver el detalle por alumno e incidencias de seguridad.</p></div>
    ${blocks.length ? blocks.map(({ c, mods }) => `
      <div class="level-block">
        <div class="level-title"><h2>${esc(c.name)}</h2><span class="rule"></span></div>
        <div class="list">
          ${mods.length ? mods.map((m) => `
            <div class="list-row">
              <div><b>${esc(m.title)}</b><span class="sub">${m.questions_per_exam} preguntas · corte ${m.passing_score}%</span></div>
              <a class="btn btn-ghost sm" href="#/modulo/${m.id}">Ver resultados ${I.arrowRight}</a>
            </div>`).join("") : `<div class="empty small">Sin módulos.</div>`}
        </div>
      </div>`).join("") : `<div class="empty">Aún no tienes cursos.</div>`}`;
  render("resultados", "Resultados", html);
}
