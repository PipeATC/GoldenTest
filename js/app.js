/* Golden Eagle Academy — SPA
   Enrutado por hash, motor de examen con temporizador, resultados y PWA. */
(function () {
  "use strict";
  const D = window.GE_DATA;
  const LOGO = "assets/logo-eagle.png";

  /* ----------------------------- Iconos SVG ----------------------------- */
  const I = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
    exams: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2V4a1 1 0 0 1 1-1z"/><path d="M9 12l2 2 4-4"/></svg>',
    resources: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 1-2-2z"/><path d="M20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2z"/></svg>',
    progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></svg>',
    trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg>',
    medal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h12"/></svg>',
    headphones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="2" y="14" width="5" height="7" rx="1.5"/><rect x="17" y="14" width="5" height="7" rx="1.5"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/><path d="M15 15a6 6 0 0 0 0-8"/><path d="M18 18a10 10 0 0 0 0-14"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z"/><circle cx="18" cy="17" r="1.5"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V4h11l-1.5 4L15 12H4"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    checkCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
    xCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12c.7.7 1 1.4 1 2h6c0-.6.3-1.3 1-2A7 7 0 0 0 12 2z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/></svg>',
  };

  /* ----------------------------- Utilidades ----------------------------- */
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k, def) { try { return JSON.parse(localStorage.getItem("ge_" + k)) ?? def; } catch { return def; } },
    set(k, v) { try { localStorage.setItem("ge_" + k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem("ge_" + k); } catch {} },
  };

  const NAV = [
    { key: "dashboard", label: "Dashboard", icon: "dashboard", route: "#/" },
    { key: "examenes", label: "My Modules", icon: "exams", route: "#/examenes" },
    { key: "recursos", label: "Study Resources", icon: "resources", route: "#/recursos" },
    { key: "resultados", label: "Results & Progress", icon: "progress", route: "#/resultados" },
    { key: "ajustes", label: "Settings", icon: "settings", route: "#/ajustes" },
  ];

  /* ----------------------------- Toasts ----------------------------- */
  function toast(msg, action) {
    let host = $("#toastHost");
    if (!host) { host = document.createElement("div"); host.id = "toastHost"; host.className = "toast-host"; document.body.appendChild(host); }
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span>${msg}</span>`;
    if (action) {
      const b = document.createElement("button");
      b.className = "toast-btn"; b.textContent = action.label;
      b.onclick = () => { action.onClick(); el.remove(); };
      el.appendChild(b);
    }
    host.appendChild(el);
    setTimeout(() => el.remove(), action ? 9000 : 3200);
  }

  /* ----------------------------- Chrome (shell) ----------------------------- */
  function sidebar(active) {
    const s = D.student;
    return `
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <img src="${LOGO}" alt="Golden Eagle Academy">
        <div>
          <span class="brand-name">Academy</span>
          <span class="brand-sub">Golden Eagle</span>
        </div>
      </div>
      <nav class="nav">
        ${NAV.map((n) => `<a href="${n.route}" class="${active === n.key ? "active" : ""}">${I[n.icon]}<span>${n.label}</span></a>`).join("")}
      </nav>
      <div class="sidebar-spacer"></div>
      <div class="goal-card">
        <span class="goal-label">Current Goal</span>
        <div class="goal-value">${esc(s.goal)}</div>
        <div class="goal-bar"><span style="width:${s.goalProgress}%"></span></div>
      </div>
    </aside>`;
  }

  function topbar() {
    const s = D.student;
    return `
    <header class="topbar">
      <div class="search">
        ${I.search}
        <input type="text" placeholder="Search modules or resources…" aria-label="Search">
      </div>
      <div class="topbar-right">
        <button class="icon-btn" aria-label="Notifications" data-toast="No new notifications">${I.bell}<span class="dot"></span></button>
        <div class="user">
          <div class="u-name"><b>${esc(s.name)}</b><span>${esc(s.role)}</span></div>
          <img class="avatar" src="${s.avatar}" alt="${esc(s.name)}">
        </div>
      </div>
    </header>`;
  }

  function shell(active, contentHTML) {
    return `
    <div class="mobile-bar">
      <button class="hamburger" id="hamburger" aria-label="Menu">${I.menu}</button>
      <img src="${LOGO}" alt=""><span class="brand-name">Golden Eagle</span>
    </div>
    <div class="app">
      ${sidebar(active)}
      <div class="scrim" id="scrim"></div>
      <div class="main">
        ${topbar()}
        <main class="content"><div class="container">${contentHTML}</div></main>
      </div>
    </div>`;
  }

  /* ----------------------------- Vistas ----------------------------- */
  function viewDashboard() {
    const s = D.student;
    const featured = D.exams.find((e) => e.featured) || D.exams[0];
    const upcoming = D.exams.slice(0, 2);
    const html = `
      <section class="hero">
        <div>
          <h1>Welcome, ${esc(s.name.split(" ")[0])}!</h1>
          <p>Ready to reach ICAO Level 6? You're on a ${s.streak}-day streak.</p>
        </div>
        <a class="btn btn-gold" href="#/examen/${featured.id}">Start Next Module</a>
        <img class="eagle-watermark" src="${LOGO}" alt="">
      </section>

      <div class="stats">
        <div class="stat">
          <div class="stat-top"><span class="stat-label">Current Level</span><span class="stat-emblem navy">${I.trend}</span></div>
          <div class="stat-value">${esc(s.level)}</div>
          <div class="progress-line" style="margin-top:16px"><span style="width:${s.levelProgress}%"></span></div>
          <div class="stat-foot">${s.levelProgress}% to ${esc(s.levelTarget)}</div>
        </div>
        <div class="stat">
          <div class="stat-top"><span class="stat-label">Hours Studied</span><span class="stat-emblem gold">${I.clock}</span></div>
          <div class="stat-value">${s.hoursStudied} <small>hrs</small></div>
          <div class="sparkline">${sparkline(["#7a5900"])}</div>
        </div>
        <div class="stat dark">
          <div class="stat-top"><span class="stat-label">Average Score</span><span class="stat-emblem ghost">${I.medal}</span></div>
          <div class="stat-value">${s.averageScore} <small>%</small></div>
          <div class="mini-tags"><span class="mini-tag">Comprehension: ${s.comprehension}%</span><span class="mini-tag">Fluency: ${s.fluency}%</span></div>
        </div>
      </div>

      <div class="dash-grid" style="margin-top:6px">
        <div>
          <div class="section-head"><h2>Upcoming Modules</h2><a class="link-more" href="#/examenes">View All ${I.arrowRight}</a></div>
          ${upcoming.map((e, idx) => `
            <div class="exam-row ${idx === 0 ? "" : "muted"}">
              <div class="date-badge ${idx === 0 ? "" : "muted"}"><span class="m">${e.dateBadge.m}</span><span class="d">${e.dateBadge.d}</span></div>
              <div class="exam-main">
                <h3>${esc(e.title)}</h3>
                <div class="exam-tags">
                  <span class="chip">Level: ${esc(e.difficulty)}</span>
                  <span class="chip">${I.clock}${formatDur(e.minutes)}</span>
                </div>
              </div>
              <a class="round-btn ${idx === 0 ? "" : "ghost"}" href="#/examen/${e.id}" aria-label="Open module">${idx === 0 ? I.play : I.info}</a>
            </div>`).join("")}

          <div class="section-head"><h2>Recent Activity</h2></div>
          <div class="card activity">
            ${D.recentActivity.map((a) => `
              <div class="activity-item">
                <span class="activity-ico" style="background:${a.tint};color:${a.tintText || "#fff"}">${I[a.icon]}</span>
                <div class="a-main"><b>${esc(a.title)}</b><span>${esc(a.when)}</span></div>
                <span class="score-pill">${esc(a.score)}</span>
              </div>`).join("")}
          </div>
        </div>

        <div class="rail">
          <div class="focus-card">
            <h3><span class="spark">${I.spark}</span> Focus Area</h3>
            <p>Based on recent sessions, your fluency in non-routine situations could use a boost. Try these targeted resources:</p>
            ${D.focusResources.map((r) => `
              <div class="resource"><span class="r-ico">${I[r.icon]}</span><div><b>${esc(r.title)}</b><span>${esc(r.sub)}</span></div></div>`).join("")}
          </div>
          <div class="tip-card">
            <div class="tip-bg"></div>
            <div class="tip-body">
              <span class="tip-kicker">Study Tip</span>
              <p>Rehearse standard phraseology daily — consistency is what prevents readback errors on frequency.</p>
            </div>
          </div>
        </div>
      </div>`;
    return shell("dashboard", html);
  }

  function sparkline(colors) {
    return `<svg viewBox="0 0 260 70" width="100%" height="56" preserveAspectRatio="none">
      <path d="M0,55 C30,52 45,20 70,40 C95,58 110,30 140,34 C170,38 190,10 220,18 C240,22 250,16 260,14"
        fill="none" stroke="${colors[0]}" stroke-width="3" stroke-linecap="round"/></svg>`;
  }

  function formatDur(min) {
    if (min >= 60) { const h = min / 60; return (Number.isInteger(h) ? h : h.toFixed(1)) + (h === 1 ? " Hour" : " Hours"); }
    return min + " Mins";
  }

  function viewExamLibrary(filter) {
    const activeFilter = filter || "All Levels";
    const levels = D.levels.filter((lv) => D.exams.some((e) => e.level === lv));
    const shown = activeFilter === "All Levels" ? levels : levels.filter((l) => l === activeFilter);
    const blocks = shown.map((lv) => {
      const items = D.exams.filter((e) => e.level === lv);
      if (!items.length) return "";
      return `
        <div class="level-block">
          <div class="level-title"><h2>${esc(lv)}</h2><span class="rule"></span></div>
          <div class="exam-cards">
            ${items.map(examCard).join("")}
          </div>
        </div>`;
    }).join("");

    const html = `
      <div class="page-head">
        <h1>Module Library</h1>
        <p>Access our full suite of Aviation English practice modules, organised by ICAO language proficiency level.</p>
      </div>
      <div class="lib-grid">
        <div class="filter-list">
          ${["All Levels", ...D.levels].map((l) => `<button data-filter="${esc(l)}" class="${l === activeFilter ? "active" : ""}">${esc(l)}</button>`).join("")}
        </div>
        <div>${blocks || '<div class="empty">No modules at this level yet.</div>'}</div>
      </div>`;
    return shell("examenes", html);
  }

  function examCard(e) {
    const badgeClass = e.badge === "brown" ? "badge-brown" : "badge-gold";
    const done = store.get("result_" + e.id, null);
    return `
      <div class="exam-card">
        <div class="ec-top">
          <span class="badge ${badgeClass}">${esc(e.levelTag)}</span>
          <span class="time-chip">${I.clock}${e.minutes} mins</span>
        </div>
        <h3>${esc(e.title)}</h3>
        <p class="ec-desc">${esc(e.description)}</p>
        <div class="ec-skills">${e.skills.map((sk) => skillChip(sk)).join("")}</div>
        ${done
          ? `<a class="btn btn-ghost btn-block" href="#/resultado/${e.id}">Review result (${done.percent}%)</a>`
          : `<a class="btn btn-primary btn-block" href="#/examen/${e.id}">Start Module ${I.arrowRight}</a>`}
      </div>`;
  }

  function skillChip(sk) {
    const map = {
      Comprehension: "headphones", Fluency: "speaker", Pronunciation: "speaker",
      Phraseology: "pencil", Structure: "pencil", Vocabulary: "book",
      Readback: "resources", Interactions: "resources",
    };
    const key = map[sk.split(" ")[0]] || "book";
    return `<span class="chip">${I[key]}${esc(sk)}</span>`;
  }

  /* ----------------------------- Motor de examen ----------------------------- */
  const runner = { exam: null, answers: {}, flags: {}, current: 0, remaining: 0, timerId: null };

  function viewExamRunner(id) {
    const exam = D.exams.find((e) => e.id === id);
    if (!exam) return notFound("examenes");
    // Reanudar o iniciar
    const saved = store.get("attempt_" + id, null);
    runner.exam = exam;
    runner.answers = (saved && saved.answers) || {};
    runner.flags = (saved && saved.flags) || {};
    runner.current = (saved && saved.current) || 0;
    runner.remaining = (saved && typeof saved.remaining === "number") ? saved.remaining : exam.minutes * 60;
    document.getElementById("root").innerHTML = shell("examenes", renderRunner());
    bindShell();
    bindRunner();
    startTimer();
  }

  function renderRunner() {
    const exam = runner.exam;
    const total = exam.questions.length;
    const answeredCount = Object.keys(runner.answers).length;
    const q = exam.questions[runner.current];
    return `
      <div class="exam-header">
        <div>
          <h1>${esc(exam.section)}</h1>
          <div class="sub">${esc(exam.part)}</div>
        </div>
        <div class="progress-wrap">
          <span class="p-label">Progress</span>
          <div class="progress-track"><span style="width:${Math.round(((runner.current + 1) / total) * 100)}%"></span></div>
          <span class="progress-count">${runner.current + 1} / ${total}</span>
        </div>
        <div class="timer" id="timer">${I.clock}<span id="timerText">00:00</span></div>
      </div>

      <div class="runner">
        <div>
          <div class="passage">
            <div class="instruction">${I.info}<span>${esc(exam.passage.instruction)}</span></div>
            <h4>${esc(exam.passage.title)}</h4>
            ${exam.passage.paragraphs.map((p) => `<p>${renderGaps(p)}</p>`).join("")}
          </div>
          ${renderQuestion(q)}
          <div class="runner-footer">
            <button class="btn btn-ghost" id="prevBtn" ${runner.current === 0 ? "disabled" : ""}>${I.arrowLeft} Previous</button>
            <button class="btn btn-primary" id="nextBtn">${runner.current === total - 1 ? "Review" : "Next Question"} ${I.arrowRight}</button>
            <div class="spacer"></div>
            <button class="btn btn-gold" id="submitBtn">${I.checkCircle} Submit Section</button>
          </div>
        </div>

        <aside class="navigator">
          <div class="card nav-card">
            <h3>Question Navigator</h3>
            <div class="legend">
              <span><i class="dot current"></i>Current</span>
              <span><i class="dot answered"></i>Answered</span>
              <span><i class="dot unanswered"></i>Unanswered</span>
            </div>
            <div class="nav-grid">
              ${exam.questions.map((qq, i) => {
                const cls = [
                  "nav-cell",
                  i === runner.current ? "current" : (runner.answers[qq.id] != null ? "answered" : ""),
                  runner.flags[qq.id] ? "flagged" : "",
                ].join(" ").trim();
                return `<button class="${cls}" data-goto="${i}">${i + 1}</button>`;
              }).join("")}
            </div>
            <div class="nav-actions">
              <button class="btn btn-ghost btn-block" id="flagBtn">${I.flag} ${runner.flags[exam.questions[runner.current].id] ? "Remove flag" : "Flag for review"}</button>
            </div>
          </div>
        </aside>
      </div>`;
  }

  function renderGaps(text) {
    return esc(text).replace(/\{\{(\d+)\}\}/g, (m, n) => {
      const q = runner.exam.questions.find((qq) => String(qq.gap) === n);
      const filled = q && runner.answers[q.id] != null;
      const val = filled ? esc(q.options[runner.answers[q.id]]) : "________";
      return `<span class="gap ${filled ? "filled" : ""}"><sup>(${n})</sup>${val}</span>`;
    });
  }

  function renderQuestion(q) {
    const chosen = runner.answers[q.id];
    return `
      <div class="question-card" id="questionCard">
        <div class="q-head"><span class="q-num">${runner.current + 1}</span><h3>${esc(q.prompt)}</h3></div>
        <div class="options">
          ${q.options.map((opt, i) => `
            <label class="option ${chosen === i ? "selected" : ""}" data-opt="${i}">
              <span class="radio"></span><span>${esc(String.fromCharCode(65 + i))}) ${esc(opt)}</span>
            </label>`).join("")}
        </div>
      </div>`;
  }

  function persistAttempt() {
    store.set("attempt_" + runner.exam.id, {
      answers: runner.answers, flags: runner.flags, current: runner.current, remaining: runner.remaining,
    });
  }

  function refreshRunner() {
    document.querySelector(".content .container").innerHTML = renderRunner();
    bindRunner();
    updateTimerUI();
  }

  function bindRunner() {
    const card = $("#questionCard");
    if (card) {
      card.querySelectorAll(".option").forEach((el) => {
        el.addEventListener("click", () => {
          const q = runner.exam.questions[runner.current];
          runner.answers[q.id] = Number(el.dataset.opt);
          persistAttempt();
          refreshRunner();
        });
      });
    }
    $("#prevBtn") && ($("#prevBtn").onclick = () => { if (runner.current > 0) { runner.current--; persistAttempt(); refreshRunner(); } });
    $("#nextBtn") && ($("#nextBtn").onclick = () => {
      if (runner.current < runner.exam.questions.length - 1) { runner.current++; persistAttempt(); refreshRunner(); }
      else confirmSubmit();
    });
    $("#submitBtn") && ($("#submitBtn").onclick = confirmSubmit);
    $("#flagBtn") && ($("#flagBtn").onclick = () => {
      const q = runner.exam.questions[runner.current];
      runner.flags[q.id] = !runner.flags[q.id];
      persistAttempt(); refreshRunner();
    });
    document.querySelectorAll("[data-goto]").forEach((b) => {
      b.onclick = () => { runner.current = Number(b.dataset.goto); persistAttempt(); refreshRunner(); };
    });
  }

  function startTimer() {
    stopTimer();
    updateTimerUI();
    runner.timerId = setInterval(() => {
      runner.remaining--;
      if (runner.remaining <= 0) { runner.remaining = 0; stopTimer(); toast("Time is up. Submitting your module…"); finalizeExam(); return; }
      if (runner.remaining % 5 === 0) persistAttempt();
      updateTimerUI();
    }, 1000);
  }
  function stopTimer() { if (runner.timerId) { clearInterval(runner.timerId); runner.timerId = null; } }
  function updateTimerUI() {
    const t = $("#timerText"); if (!t) return;
    const m = Math.floor(runner.remaining / 60), s = runner.remaining % 60;
    t.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    const box = $("#timer");
    if (box) box.classList.toggle("calm", runner.remaining > 300);
  }

  function confirmSubmit() {
    const total = runner.exam.questions.length;
    const answered = Object.keys(runner.answers).length;
    const unanswered = total - answered;
    modal({
      title: "Submit this section?",
      body: unanswered > 0
        ? `You still have <b>${unanswered}</b> unanswered question(s) out of ${total}. Once submitted, you cannot change your answers.`
        : `You have answered all ${total} questions. Once submitted, you cannot change your answers.`,
      confirmLabel: "Submit now",
      onConfirm: finalizeExam,
    });
  }

  function finalizeExam() {
    stopTimer();
    const exam = runner.exam;
    let correct = 0;
    const review = exam.questions.map((q) => {
      const chosen = runner.answers[q.id];
      const ok = chosen === q.answer;
      if (ok) correct++;
      return { stem: q.prompt, options: q.options, answer: q.answer, chosen: chosen ?? -1, correct: ok, explanation: q.explanation };
    });
    const total = exam.questions.length;
    const percent = Math.round((correct / total) * 100);
    const result = {
      examId: exam.id, examTitle: exam.title, percent, correct, incorrect: total - correct, total,
      timeSpent: exam.minutes * 60 - runner.remaining, date: new Date().toISOString(), review,
    };
    store.set("result_" + exam.id, result);
    store.del("attempt_" + exam.id);
    location.hash = "#/resultado/" + exam.id;
  }

  /* ----------------------------- Resultados ----------------------------- */
  function viewAttemptResult(id) {
    const exam = D.exams.find((e) => e.id === id);
    const r = store.get("result_" + id, null);
    if (!exam || !r) return notFound("resultados");
    const passing = 60; // ICAO Operational Level 4 is the minimum to operate internationally
    const passed = r.percent >= passing;
    const verdict = icaoVerdict(r.percent);
    const html = `
      <div class="results-head">
        <div>
          <span class="badge badge-gold">Module Completed</span>
          <span class="chip" style="margin-left:8px">${new Date(r.date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</span>
          <h1>${esc(exam.title)}</h1>
          <p>Your performance breakdown for this ${esc(exam.section)} section, rated against the ICAO scale.</p>
        </div>
        <div class="results-actions">
          <a class="btn btn-ghost" href="#/">${I.dashboard} Dashboard</a>
          <button class="btn btn-primary" data-toast="Certificate generated (demo)">${I.download} Certificate</button>
        </div>
      </div>

      <div class="result-top">
        <div class="grade-card">
          <span class="g-label">Overall Grade</span>
          <div class="g-value">${r.percent}<span class="pct">%</span> <span class="verdict">${esc(verdict)}</span></div>
          <div class="g-star">${I.star}</div>
          <div class="grade-scale">
            <div class="bar"><span style="width:${r.percent}%"></span><i class="pass" style="left:${passing}%"></i></div>
            <div class="ticks"><span>0%</span><span>Passing: ${passing}%</span><span>100%</span></div>
          </div>
        </div>
        <div class="feedback-card">
          <h3><span class="fi">${I.spark}</span> AI Instructor Feedback</h3>
          <p>${passed
            ? `Well done, ${esc(D.student.name.split(" ")[0])}. You answered ${r.correct} of ${r.total} correctly, placing you at ${esc(verdict)}. Your comprehension of standard phraseology is solid — keep building fluency in non-routine exchanges.`
            : `Keep practising, ${esc(D.student.name.split(" ")[0])}. You answered ${r.correct} of ${r.total} correctly, below the Operational Level 4 threshold. Review the explanations below to close the gaps.`}</p>
          <div class="focus-box">
            <b>${I.trend} Next Focus Areas</b>
            <ul>
              <li>Review the questions marked incorrect and read each explanation.</li>
              <li>Drill <b>readback discipline</b> on clearances, runway and level assignments.</li>
              <li>Practise <b>plain language</b> for distress and urgency situations.</li>
            </ul>
          </div>
          <div class="feedback-foot">
            <span class="status">Status: ${passed ? "Ready for the next module." : "Repeat to reach Operational Level 4."}</span>
            <a class="btn btn-gold" href="#/examenes">Start Next Module</a>
          </div>
        </div>
      </div>

      <div class="section-head"><h2>ICAO Descriptor Breakdown</h2></div>
      <div class="skills-grid">
        ${skillBreakdown(r).map((sk) => `
          <div class="skill-tile ${sk.low ? "low" : ""}">
            <div class="st-top"><span class="st-ico">${I[sk.icon]}</span><span class="st-pct">${sk.pct}%</span></div>
            <div class="st-name">${esc(sk.name)}</div>
            <div class="st-desc">${esc(sk.desc)}</div>
            <div class="st-bars">${[0,1,2,3,4].map((i) => `<i class="${i < sk.filled ? (i === sk.filled - 1 ? "on gold" : "on") : ""}"></i>`).join("")}</div>
          </div>`).join("")}
      </div>

      <div class="section-head"><h2>Detailed Review</h2></div>
      <div class="review">
        <aside class="review-side">
          <h3>Summary</h3>
          <div class="rev-item active"><span>${esc(exam.section)}</span><span class="mini-pct">${r.percent}%</span></div>
          <div class="rev-legend">
            <span><i class="dot" style="background:var(--success)"></i>Correct (${r.correct})</span>
            <span><i class="dot" style="background:var(--error)"></i>Incorrect (${r.incorrect})</span>
          </div>
        </aside>
        <div class="qreview">
          ${r.review.map((qr, i) => renderQReview(qr, i)).join("")}
        </div>
      </div>`;
    return shell("resultados", html);
  }

  // Demo mapping of an overall score to an ICAO proficiency level.
  function icaoVerdict(pct) {
    if (pct >= 90) return "ICAO Level 6 (Expert)";
    if (pct >= 75) return "ICAO Level 5 (Extended)";
    if (pct >= 60) return "ICAO Level 4 (Operational)";
    if (pct >= 40) return "ICAO Level 3 (Pre-Operational)";
    return "ICAO Level 2 (Elementary)";
  }

  function skillBreakdown(r) {
    // Derive the six ICAO language-proficiency descriptors from the overall score (demo).
    const base = r.percent;
    const mk = (name, icon, delta, desc) => {
      const pct = Math.max(0, Math.min(100, base + delta));
      return { name, icon, pct, filled: Math.max(1, Math.round(pct / 20)), low: pct < 60, desc };
    };
    return [
      mk("Pronunciation", "speaker", 2, "Intelligible to the aeronautical community; minor first-language influence."),
      mk("Structure", "pencil", -4, "Basic structures used well; complex forms still developing."),
      mk("Vocabulary", "book", 1, "Sufficient range for common topics; paraphrases when unsure."),
      mk("Fluency", "spark", -6, "Appropriate tempo; occasional hesitation in non-routine exchanges."),
      mk("Comprehension", "headphones", 3, "Accurate on common and work-related topics, including read-back checks."),
      mk("Interactions", "resources", -8, "Generally responsive; verify and clarify meaning under pressure."),
    ];
  }

  function renderQReview(qr, i) {
    return `
      <div class="qr ${qr.correct ? "" : "wrong"}">
        <div class="qr-head">
          <span class="qr-kicker">Question ${i + 1}</span>
          <span style="color:${qr.correct ? "var(--success)" : "var(--error)"}">${qr.correct ? I.checkCircle : I.xCircle}</span>
        </div>
        <div class="qr-stem">${esc(qr.stem)}</div>
        ${qr.options.map((opt, oi) => {
          let cls = "opt-review dim";
          let tail = "";
          if (oi === qr.answer) { cls = "opt-review correct"; tail = I.check; }
          if (oi === qr.chosen && !qr.correct) { cls = "opt-review chosen-wrong"; tail = I.xCircle; }
          const label = `${esc(String.fromCharCode(65 + oi))}) ${esc(opt)}`;
          return `<div class="${cls}"><span>${cls.includes("dim") ? `<s>${label}</s>` : label}</span><span>${tail}</span></div>`;
        }).join("")}
        ${qr.explanation ? `<div class="explanation"><span class="ei">${I.bulb}</span><div><b>Instructor Explanation</b><p>${esc(qr.explanation)}</p></div></div>` : ""}
      </div>`;
  }

  function viewResultsHub() {
    const results = D.exams.map((e) => ({ e, r: store.get("result_" + e.id, null) })).filter((x) => x.r);
    let html = `
      <div class="page-head"><h1>Results &amp; Progress</h1><p>Review your attempts and your ICAO descriptor breakdown for each module.</p></div>`;
    if (!results.length) {
      html += `
        <div class="card" style="padding:0;overflow:hidden;margin-top:24px">
          ${resultsSamplePreview()}
        </div>
        <div class="empty">You haven't completed any module yet. <a class="link-more" href="#/examenes" style="display:inline-flex">Go to my modules ${I.arrowRight}</a></div>`;
    } else {
      html += `<div class="exam-cards" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr));margin-top:24px">
        ${results.map(({ e, r }) => `
          <div class="exam-card">
            <div class="ec-top"><span class="badge badge-gold">${r.percent}%</span><span class="time-chip">${I.clock}${new Date(r.date).toLocaleDateString("en-US")}</span></div>
            <h3>${esc(e.title)}</h3>
            <p class="ec-desc">Correct: ${r.correct}/${r.total} · ${esc(icaoVerdict(r.percent))}</p>
            <a class="btn btn-primary btn-block" href="#/resultado/${e.id}">View breakdown ${I.arrowRight}</a>
          </div>`).join("")}
      </div>`;
    }
    return shell("resultados", html);
  }

  function resultsSamplePreview() {
    const s = D.sampleResult;
    return `<div style="padding:26px">
      <span class="badge badge-navy">Example</span>
      <h2 style="font-size:26px;margin:12px 0 4px">${esc(s.examTitle)}</h2>
      <p style="color:var(--slate-gray)">This is how your detailed report will look after you take a module: overall score, ICAO level verdict, instructor feedback and a question-by-question review.</p>
    </div>`;
  }

  function viewSimple(activeKey, title, subtitle, bodyHTML) {
    return shell(activeKey, `
      <div class="page-head"><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>
      <div style="margin-top:24px">${bodyHTML}</div>`);
  }

  function viewResources() {
    const cards = [
      { icon: "book", t: "Standard Phraseology Deck", d: "Flashcards and quiz covering ICAO standard words and phrases.", tag: "Flashcards" },
      { icon: "play", t: "Reading Back Clearances", d: "12-minute video lesson on correct read-back of clearances and levels.", tag: "Video" },
      { icon: "headphones", t: "ATC Comms: Listening Bank", d: "Recorded pilot–controller exchanges across a range of accents.", tag: "Audio" },
      { icon: "speaker", t: "Emergency Phraseology Guide", d: "MAYDAY vs PAN-PAN, plain language and distress procedures.", tag: "Reference" },
      { icon: "pencil", t: "ICAO Phonetic Alphabet", d: "Practice the alphabet, numbers and pronunciation conventions.", tag: "Drill" },
      { icon: "resources", t: "METAR & TAF Basics", d: "Decode aerodrome weather reports and forecasts step by step.", tag: "Weather" },
    ];
    const body = `<div class="exam-cards" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
      ${cards.map((c) => `
        <div class="exam-card">
          <div class="ec-top"><span class="badge badge-gold">${c.tag}</span><span class="st-ico" style="width:40px;height:40px;border-radius:999px;background:var(--surface-container-low);display:grid;place-items:center;color:var(--eagle-navy)">${I[c.icon]}</span></div>
          <h3>${esc(c.t)}</h3>
          <p class="ec-desc">${esc(c.d)}</p>
          <button class="btn btn-ghost btn-block" data-toast="Resource coming soon">Open resource ${I.arrowRight}</button>
        </div>`).join("")}
    </div>`;
    return viewSimple("recursos", "Study Resources", "Aviation English materials to build all six ICAO language descriptors.", body);
  }

  function viewSettings() {
    const s = D.student;
    const installed = window.matchMedia("(display-mode: standalone)").matches;
    const body = `
      <div class="card" style="padding:26px;max-width:640px">
        <h3 style="font-size:22px;margin-bottom:16px">Profile</h3>
        <div class="rev-item"><span>Name</span><b>${esc(s.name)}</b></div>
        <div class="rev-item"><span>Current level</span><b>${esc(s.level)}</b></div>
        <div class="rev-item"><span>Goal</span><b>${esc(s.goal)}</b></div>
        <div class="rev-item"><span>App installed</span><b>${installed ? "Yes" : "No"}</b></div>
        <div style="display:flex;gap:12px;margin-top:22px;flex-wrap:wrap">
          <button class="btn btn-gold" id="installBtn2">${I.download} Install app</button>
          <button class="btn btn-ghost" id="resetBtn">Clear saved attempts</button>
        </div>
      </div>`;
    return viewSimple("ajustes", "Settings", "Manage your profile and install the application.", body);
  }

  /* ----------------------------- Modal ----------------------------- */
  function modal({ title, body, confirmLabel, onConfirm, cancelLabel }) {
    const back = document.createElement("div");
    back.className = "modal-backdrop";
    back.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <h3>${title}</h3>
        <p>${body}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-cancel>${cancelLabel || "Cancel"}</button>
          <button class="btn btn-primary" data-confirm>${confirmLabel || "Confirm"}</button>
        </div>
      </div>`;
    const close = () => back.remove();
    back.addEventListener("click", (e) => { if (e.target === back) close(); });
    back.querySelector("[data-cancel]").onclick = close;
    back.querySelector("[data-confirm]").onclick = () => { close(); onConfirm && onConfirm(); };
    document.body.appendChild(back);
  }

  function notFound(back) {
    return shell(back, `<div class="empty"><h2 style="font-size:26px">Content not found</h2><p>The requested item does not exist.</p><a class="btn btn-primary" href="#/">Back to home</a></div>`);
  }

  /* ----------------------------- Router ----------------------------- */
  function render(html) {
    document.getElementById("root").innerHTML = html;
    bindShell();
    window.scrollTo(0, 0);
  }

  function bindShell() {
    document.querySelectorAll("[data-toast]").forEach((b) => { b.onclick = () => toast(b.dataset.toast); });
    const ham = $("#hamburger"), scrim = $("#scrim");
    if (ham) ham.onclick = () => document.body.classList.toggle("nav-open");
    if (scrim) scrim.onclick = () => document.body.classList.remove("nav-open");
    document.querySelectorAll(".nav a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("nav-open")));
    const ib2 = $("#installBtn2"); if (ib2) ib2.onclick = triggerInstall;
    const rb = $("#resetBtn"); if (rb) rb.onclick = () => {
      D.exams.forEach((e) => { store.del("result_" + e.id); store.del("attempt_" + e.id); });
      toast("Attempts cleared"); route();
    };
  }

  function route() {
    stopTimer();
    const hash = location.hash || "#/";
    const [path, arg] = hash.replace(/^#\//, "").split("/");
    if (!path || path === "dashboard") return render(viewDashboard());
    if (path === "examenes") return render(viewExamLibrary(currentFilter));
    if (path === "recursos") return render(viewResources());
    if (path === "resultados") return render(viewResultsHub());
    if (path === "ajustes") return render(viewSettings());
    if (path === "examen") return viewExamRunner(decodeURIComponent(arg || ""));
    if (path === "resultado") return render(viewAttemptResult(decodeURIComponent(arg || "")));
    return render(notFound("dashboard"));
  }

  let currentFilter = "All Levels";
  document.addEventListener("click", (e) => {
    const f = e.target.closest("[data-filter]");
    if (f) { currentFilter = f.dataset.filter; render(viewExamLibrary(currentFilter)); }
  });

  window.addEventListener("hashchange", route);

  // Keep the mobile drawer state sane across viewport changes and keyboard use.
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) document.body.classList.remove("nav-open");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    document.body.classList.remove("nav-open");
    const openModal = document.querySelector(".modal-backdrop");
    if (openModal) openModal.remove();
  });

  /* ----------------------------- PWA install ----------------------------- */
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!store.get("install_dismissed", false)) {
      toast("Install Golden Eagle Academy for offline access.", {
        label: "Install",
        onClick: triggerInstall,
      });
    }
  });
  window.addEventListener("appinstalled", () => { deferredPrompt = null; toast("App installed!"); });

  async function triggerInstall() {
    if (!deferredPrompt) {
      toast("Use your browser menu → “Install app” / “Add to Home Screen”.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "dismissed") store.set("install_dismissed", true);
    deferredPrompt = null;
  }

  /* ----------------------------- Service worker ----------------------------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((err) => console.warn("SW registration failed:", err));
    });
  }

  /* Init */
  route();
})();
