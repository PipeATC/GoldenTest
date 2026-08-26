import { I, esc, toast, modal, $, $$, formatDur, fmtDate, windowState } from "../ui.js";
import { render, renderRaw } from "../render.js";
import { session } from "../auth.js";
import { myAssignments, startExam, submitExam, reviewExam, resumeExam, saveProgress } from "../api.js";
import { createExamGuard, preflightCheck } from "../security.js";

/* ============================== Inicio ============================== */
export async function studentDashboard() {
  render("inicio", "Inicio", `<div class="empty">Cargando…</div>`);
  const first = (session.profile?.full_name || "").split(" ")[0] || "alumno";
  let assigns = [];
  try { assigns = await myAssignments(); } catch (e) { return render("inicio", "Inicio", errorBox(e)); }

  const pending = assigns.filter((a) => !a.attempt || a.attempt.status === "in_progress");
  const open = pending.filter((a) => windowState(a.opens_at, a.closes_at) === "open");
  const done = assigns.filter((a) => a.attempt && a.attempt.status === "submitted");
  const avg = done.length ? Math.round(done.reduce((s, a) => s + (a.attempt.score || 0), 0) / done.length) : null;

  const html = `
    <section class="hero">
      <div>
        <h1>Hola, ${esc(first)}</h1>
        <p>${open.length ? `Tienes <b>${open.length}</b> prueba(s) disponible(s) para rendir ahora.` : "No tienes pruebas disponibles en este momento."}</p>
      </div>
      ${open.length ? `<a class="btn btn-gold" href="#/examenes">Ir a mis pruebas ${I.arrowRight}</a>` : ""}
    </section>

    <div class="stats">
      <div class="stat"><div class="stat-top"><span class="stat-label">Pruebas asignadas</span><span class="stat-emblem navy">${I.exams}</span></div><div class="stat-value">${assigns.length}</div></div>
      <div class="stat"><div class="stat-top"><span class="stat-label">Disponibles ahora</span><span class="stat-emblem gold">${I.clock}</span></div><div class="stat-value">${open.length}</div></div>
      <div class="stat dark"><div class="stat-top"><span class="stat-label">Promedio</span><span class="stat-emblem ghost">${I.medal}</span></div><div class="stat-value">${avg == null ? "—" : avg + " <small>%</small>"}</div></div>
    </div>

    <div class="section-head"><h2>Próximas pruebas</h2><a class="link-more" href="#/examenes">Ver todas ${I.arrowRight}</a></div>
    ${assigns.length ? assigns.slice(0, 4).map(assignRow).join("") : `<div class="empty">Aún no tienes pruebas asignadas.</div>`}
  `;
  render("inicio", "Inicio", html);
}

/* ============================== Mis pruebas ============================== */
export async function studentExams() {
  render("examenes", "Mis pruebas", `<div class="empty">Cargando…</div>`);
  let assigns = [];
  try { assigns = await myAssignments(); } catch (e) { return render("examenes", "Mis pruebas", errorBox(e)); }

  const html = `
    <div class="page-head"><h1>Mis pruebas</h1><p>Rinde tus pruebas dentro del bloque horario asignado por tu profesor.</p></div>
    <div style="margin-top:20px">
      ${assigns.length ? assigns.map(assignRow).join("") : `<div class="empty">No tienes pruebas asignadas todavía.</div>`}
    </div>`;
  render("examenes", "Mis pruebas", html);
}

function assignRow(a) {
  const m = a.modules || {};
  const st = windowState(a.opens_at, a.closes_at);
  const submitted = a.attempt && a.attempt.status === "submitted";
  const stMeta = {
    open: { cls: "open", label: "Disponible" },
    upcoming: { cls: "upcoming", label: "Programada" },
    closed: { cls: "closed", label: "Cerrada" },
  }[st];

  let action;
  if (submitted) action = `<a class="btn btn-ghost" href="#/resultado/${a.attempt.id}">Ver resultado (${a.attempt.score}%)</a>`;
  else if (st === "open") action = `<a class="btn btn-primary" href="#/rendir/${a.id}">${a.attempt ? "Continuar" : "Comenzar"} ${I.arrowRight}</a>`;
  else if (st === "upcoming") action = `<button class="btn btn-ghost" disabled>Abre ${fmtDate(a.opens_at)}</button>`;
  else action = `<button class="btn btn-ghost" disabled>Cerrada</button>`;

  return `
    <div class="assign-row">
      <div class="assign-main">
        <div class="assign-title">
          <span class="status-pill ${stMeta.cls}">${stMeta.label}</span>
          <h3>${esc(m.title || "Prueba")}</h3>
        </div>
        <div class="assign-meta">
          ${m.courses?.name ? `<span class="chip">${I.courses}${esc(m.courses.name)}</span>` : ""}
          <span class="chip">${I.clock}${formatDur(m.duration_minutes || 0)}</span>
          <span class="chip">${I.exams}${m.questions_per_exam || 0} preguntas</span>
          ${a.closes_at ? `<span class="chip">Cierra: ${fmtDate(a.closes_at)}</span>` : ""}
        </div>
      </div>
      <div class="assign-action">${action}</div>
    </div>`;
}

/* ============================== Motor de examen ============================== */
const R = { attemptId: null, questions: [], answers: {}, current: 0, deadline: 0, timerId: null, guard: null, module: null, saveTimer: null, security: { action: "flag", max_incidents: 3 }, frozen: false };

export async function studentRunExam(assignmentId) {
  renderRaw(`<div class="exam-loading"><div class="spinner"></div><p>Preparando tu prueba…</p></div>`);
  let data;
  try {
    data = await startExam(assignmentId);
  } catch (e) {
    renderRaw(`<div class="exam-loading"><h2>No se pudo iniciar</h2><p>${esc(e.message || e)}</p><a class="btn btn-primary" href="#/examenes">Volver</a></div>`);
    return;
  }

  R.attemptId = data.attempt_id;
  R.questions = data.questions || [];
  R.answers = data.answers || {};
  R.current = 0;
  R.module = data.module;
  R.security = data.security || { action: "flag", max_incidents: 3 };
  R.frozen = false;

  const started = data.started_at ? new Date(data.started_at).getTime() : Date.now();
  const byDuration = started + (data.duration_minutes || 60) * 60000;
  const byWindow = data.closes_at ? new Date(data.closes_at).getTime() : Infinity;
  R.deadline = Math.min(byDuration, byWindow);

  // Chequeo previo del dispositivo (p.ej. iOS debe correr como PWA instalada).
  const block = preflightCheck();

  renderRaw(examIntro(data, block));
  if (block) return;  // sin botón de comenzar hasta resolver el bloqueo

  $("#beginExam").onclick = async () => {
    R.guard = createExamGuard({
      onEvent: () => scheduleSave(),
      onIncident: handleIncident,
    });
    R.guard.start();
    drawRunner();
    startTimer();
  };
}

// Política ante una incidencia, según la configuración del módulo.
function handleIncident(ev, count) {
  scheduleSave();
  const action = R.security.action || "flag";
  if (action === "lock") { freezeExam(); return; }
  if (action === "submit") {
    const max = R.security.max_incidents || 3;
    toast(`⚠️ Saliste de la prueba (${count}/${max}). Vuelve a la pantalla.`);
    if (count >= max) { toast("Se alcanzó el máximo de salidas. Entregando…"); finalize(); }
    return;
  }
  toast("⚠️ Salida de la prueba registrada. Vuelve a la pantalla.");
}

function examIntro(data, block) {
  const inner = block
    ? `
      <span class="lock-emblem warn">${I.info}</span>
      <h1>${esc(block.title)}</h1>
      <p class="intro-sub">${esc(block.detail)}</p>
      <div class="intro-actions">
        <a class="btn btn-ghost" href="#/examenes">Volver</a>
        <button class="btn btn-primary" onclick="location.reload()">Ya lo hice, reintentar</button>
      </div>`
    : `
      <span class="lock-emblem">${I.lock}</span>
      <h1>${esc(data.module?.title || "Prueba")}</h1>
      <p class="intro-sub">Estás por comenzar una prueba en <b>modo seguro</b>.</p>
      <ul class="rules">
        <li>${I.shield} La prueba se abre en <b>pantalla completa</b>.</li>
        <li>${I.info} Si cambias de aplicación o pestaña, quedará <b>registrado</b>${securityConsequence()}.</li>
        <li>${I.clock} Tienes <b>${data.duration_minutes} min</b>. El tiempo corre desde ahora.</li>
        <li>${I.exams} Son <b>${(data.questions || []).length}</b> preguntas seleccionadas al azar para ti.</li>
      </ul>
      <div class="intro-actions">
        <a class="btn btn-ghost" href="#/examenes">Cancelar</a>
        <button class="btn btn-gold" id="beginExam">${I.lock} Comenzar en modo seguro</button>
      </div>
      <p class="intro-note">Nota: la web no puede impedir capturas de pantalla al 100%. Las incidencias quedan registradas para tu profesor.</p>`;
  return `<div class="exam-intro"><div class="intro-card">${inner}</div></div>`;
}

function securityConsequence() {
  if (R.security.action === "lock") return " y el examen se <b>congelará</b> hasta que el profesor lo reanude";
  if (R.security.action === "submit") return ` y tras ${R.security.max_incidents || 3} salidas se <b>entregará automáticamente</b>`;
  return "";
}

/* ---------- Congelado con código del profesor ---------- */
function freezeExam() {
  if (R.frozen) return;
  R.frozen = true;
  R.freezeStart = Date.now();
  stopTimer();
  const el = document.createElement("div");
  el.className = "freeze-overlay";
  el.id = "freezeOverlay";
  el.innerHTML = `
    <div class="freeze-card">
      <span class="lock-emblem">${I.lock}</span>
      <h2>Examen en pausa</h2>
      <p>Se detectó una salida de la prueba. Para continuar, el <b>profesor</b> debe ingresar su código.</p>
      <form id="resumeForm">
        <input type="password" id="proctorCode" inputmode="numeric" autocomplete="off" placeholder="Código del profesor" required>
        <button class="btn btn-gold btn-block" type="submit">Reanudar examen</button>
      </form>
      <p class="freeze-err" id="resumeErr"></p>
    </div>`;
  document.body.appendChild(el);
  const form = el.querySelector("#resumeForm");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const code = el.querySelector("#proctorCode").value.trim();
    const btn = form.querySelector("button");
    btn.disabled = true;
    try {
      const ok = await resumeExam(R.attemptId, code);
      if (ok) {
        // Extiende el plazo por el tiempo que estuvo congelado.
        if (R.freezeStart) { R.deadline += Date.now() - R.freezeStart; R.freezeStart = null; }
        el.remove(); R.frozen = false;
        if (R.guard) R.guard.reenterFullscreen();
        startTimer();
      }
      else { el.querySelector("#resumeErr").textContent = "Código incorrecto."; btn.disabled = false; el.querySelector("#proctorCode").value = ""; }
    } catch (err) {
      el.querySelector("#resumeErr").textContent = "Error: " + (err.message || err); btn.disabled = false;
    }
  };
  el.querySelector("#proctorCode").focus();
}

function drawRunner() {
  const total = R.questions.length;
  const q = R.questions[R.current];
  renderRaw(`
    <div class="exam-shell">
      <header class="exam-topbar">
        <div class="exam-brand">${I.lock}<span>Modo seguro</span></div>
        <div class="exam-progress">
          <div class="progress-track"><span style="width:${Math.round(((R.current + 1) / total) * 100)}%"></span></div>
          <span class="progress-count">${R.current + 1} / ${total}</span>
        </div>
        <div class="timer" id="timer">${I.clock}<span id="timerText">--:--</span></div>
      </header>

      <div class="exam-body">
        <div class="question-card" id="questionCard">
          <div class="q-head"><span class="q-num">${R.current + 1}</span><h3>${esc(q.prompt)}</h3></div>
          <div class="options">
            ${q.options.map((opt, i) => `
              <label class="option ${R.answers[q.id] === i ? "selected" : ""}" data-opt="${i}">
                <span class="radio"></span><span>${esc(String.fromCharCode(65 + i))}) ${esc(opt)}</span>
              </label>`).join("")}
          </div>
          <div class="runner-footer">
            <button class="btn btn-ghost" id="prevBtn" ${R.current === 0 ? "disabled" : ""}>${I.arrowLeft} Anterior</button>
            <button class="btn btn-primary" id="nextBtn">${R.current === total - 1 ? "Revisar" : "Siguiente"} ${I.arrowRight}</button>
            <div class="spacer"></div>
            <button class="btn btn-gold" id="submitBtn">${I.checkCircle} Entregar</button>
          </div>
        </div>

        <aside class="navigator">
          <h3>Navegador</h3>
          <div class="nav-grid">
            ${R.questions.map((qq, i) => {
              const cls = ["nav-cell", i === R.current ? "current" : (R.answers[qq.id] != null ? "answered" : "")].join(" ").trim();
              return `<button class="${cls}" data-goto="${i}">${i + 1}</button>`;
            }).join("")}
          </div>
          <p class="nav-hint">${Object.keys(R.answers).length} de ${total} respondidas</p>
        </aside>
      </div>
    </div>`);
  bindRunner();
  updateTimerUI();
}

function bindRunner() {
  $$("#questionCard .option").forEach((el) => {
    el.onclick = () => {
      const q = R.questions[R.current];
      R.answers[q.id] = Number(el.dataset.opt);
      scheduleSave();
      drawRunner();
    };
  });
  const prev = $("#prevBtn"); if (prev) prev.onclick = () => { if (R.current > 0) { R.current--; drawRunner(); } };
  const next = $("#nextBtn"); if (next) next.onclick = () => {
    if (R.current < R.questions.length - 1) { R.current++; drawRunner(); }
    else confirmSubmit();
  };
  const sub = $("#submitBtn"); if (sub) sub.onclick = confirmSubmit;
  $$("[data-goto]").forEach((b) => b.onclick = () => { R.current = Number(b.dataset.goto); drawRunner(); });
}

function scheduleSave() {
  clearTimeout(R.saveTimer);
  R.saveTimer = setTimeout(() => {
    saveProgress(R.attemptId, R.answers, R.guard ? R.guard.getEvents() : []).catch(() => {});
  }, 800);
}

function startTimer() {
  stopTimer();
  updateTimerUI();
  R.timerId = setInterval(() => {
    if (Date.now() >= R.deadline) { stopTimer(); toast("Tiempo terminado. Entregando…"); finalize(true); return; }
    updateTimerUI();
  }, 1000);
}
function stopTimer() { if (R.timerId) { clearInterval(R.timerId); R.timerId = null; } }
function updateTimerUI() {
  const t = $("#timerText"); if (!t) return;
  const rem = Math.max(0, Math.floor((R.deadline - Date.now()) / 1000));
  const m = Math.floor(rem / 60), s = rem % 60;
  t.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  const box = $("#timer"); if (box) box.classList.toggle("danger", rem <= 60);
}

async function confirmSubmit() {
  const total = R.questions.length;
  const unanswered = total - Object.keys(R.answers).length;
  const ok = await modal({
    title: "¿Entregar la prueba?",
    body: unanswered > 0
      ? `<p>Te quedan <b>${unanswered}</b> pregunta(s) sin responder de ${total}. Una vez entregada no podrás cambiar tus respuestas.</p>`
      : `<p>Respondiste las ${total} preguntas. Una vez entregada no podrás cambiar tus respuestas.</p>`,
    confirmLabel: "Entregar ahora",
  });
  if (ok) finalize(false);
}

async function finalize() {
  stopTimer();
  const attemptId = R.attemptId;
  renderRaw(`<div class="exam-loading"><div class="spinner"></div><p>Enviando y corrigiendo…</p></div>`);
  try {
    await submitExam(attemptId, R.answers);
  } catch (e) {
    // Aun con error, salimos del modo seguro y avisamos.
    toast("No se pudo entregar: " + (e.message || e));
  }
  if (R.guard) R.guard.stop();
  R.guard = null;
  location.hash = "#/resultado/" + attemptId;
}

/* ============================== Resultado ============================== */
export async function studentResult(attemptId) {
  render("resultados", "Resultado", `<div class="empty">Cargando resultado…</div>`);
  // Detalle del intento ya entregado (con respuestas correctas y explicaciones).
  let res;
  try { res = await reviewExam(attemptId); }
  catch (e) { return render("resultados", "Resultado", errorBox(e)); }

  const passed = res.passed;
  const html = `
    <div class="results-head">
      <div>
        <span class="badge ${passed ? "badge-gold" : "badge-navy"}">${passed ? "Aprobado" : "No aprobado"}</span>
        <h1>Resultado de la prueba</h1>
        <p>Respondiste correctamente ${res.correct_count} de ${res.total}.</p>
      </div>
      <a class="btn btn-ghost" href="#/examenes">${I.arrowLeft} Mis pruebas</a>
    </div>

    <div class="result-top">
      <div class="grade-card">
        <span class="g-label">Puntaje</span>
        <div class="g-value">${res.score}<span class="pct">%</span></div>
        <div class="g-star">${I.star}</div>
        <div class="grade-scale">
          <div class="bar"><span style="width:${res.score}%"></span><i class="pass" style="left:${res.passing_score}%"></i></div>
          <div class="ticks"><span>0%</span><span>Corte: ${res.passing_score}%</span><span>100%</span></div>
        </div>
      </div>
    </div>

    <div class="section-head"><h2>Revisión detallada</h2></div>
    <div class="qreview">
      ${res.review.map(renderReview).join("")}
    </div>`;
  render("resultados", "Resultado", html);
}

export async function studentResultsHub() {
  render("resultados", "Mis resultados", `<div class="empty">Cargando…</div>`);
  let assigns = [];
  try { assigns = await myAssignments(); } catch (e) { return render("resultados", "Mis resultados", errorBox(e)); }
  const done = assigns.filter((a) => a.attempt && a.attempt.status === "submitted");

  const html = `
    <div class="page-head"><h1>Mis resultados</h1><p>Revisa el detalle de las pruebas que ya entregaste.</p></div>
    ${done.length ? `
      <div class="exam-cards" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr));margin-top:20px">
        ${done.map((a) => `
          <div class="exam-card">
            <div class="ec-top"><span class="badge badge-gold">${a.attempt.score}%</span><span class="time-chip">${I.clock}${fmtDate(a.attempt.submitted_at)}</span></div>
            <h3>${esc(a.modules?.title || "Prueba")}</h3>
            <a class="btn btn-primary btn-block" href="#/resultado/${a.attempt.id}">Ver revisión ${I.arrowRight}</a>
          </div>`).join("")}
      </div>` : `<div class="empty">Todavía no has entregado ninguna prueba.</div>`}`;
  render("resultados", "Mis resultados", html);
}

function renderReview(qr, i) {
  return `
    <div class="qr ${qr.correct ? "" : "wrong"}">
      <div class="qr-head">
        <span class="qr-kicker">Pregunta ${i + 1}</span>
        <span style="color:${qr.correct ? "var(--success)" : "var(--error)"}">${qr.correct ? I.checkCircle : I.xCircle}</span>
      </div>
      <div class="qr-stem">${esc(qr.prompt)}</div>
      ${(qr.options || []).map((opt, oi) => {
        let cls = "opt-review dim", tail = "";
        if (oi === qr.correct_index) { cls = "opt-review correct"; tail = I.check; }
        if (oi === qr.chosen && !qr.correct) { cls = "opt-review chosen-wrong"; tail = I.xCircle; }
        const label = `${esc(String.fromCharCode(65 + oi))}) ${esc(opt)}`;
        return `<div class="${cls}"><span>${label}</span><span>${tail}</span></div>`;
      }).join("")}
      ${qr.explanation ? `<div class="explanation"><span class="ei">${I.bulb}</span><div><b>Explicación</b><p>${esc(qr.explanation)}</p></div></div>` : ""}
    </div>`;
}

function errorBox(e) {
  return `<div class="empty"><h2>Ocurrió un problema</h2><p>${esc(e.message || e)}</p></div>`;
}
