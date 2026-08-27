import { I, esc } from "./ui.js";
import { session, isAdmin, canTeach, roleLabel } from "./auth.js";

const LOGO = "assets/logo-eagle.png";

const TEACHER_NAV = [
  { key: "inicio", label: "Panel", icon: "dashboard", route: "#/" },
  { key: "cursos", label: "Cursos", icon: "courses", route: "#/cursos" },
  { key: "resultados", label: "Resultados", icon: "progress", route: "#/resultados" },
  { key: "ajustes", label: "Ajustes", icon: "settings", route: "#/ajustes" },
];

// El admin ve la gestión de usuarios como inicio + todo lo de profesor.
const ADMIN_NAV = [
  { key: "usuarios", label: "Usuarios", icon: "users", route: "#/usuarios" },
  { key: "inicio", label: "Panel", icon: "dashboard", route: "#/inicio" },
  { key: "cursos", label: "Cursos", icon: "courses", route: "#/cursos" },
  { key: "resultados", label: "Resultados", icon: "progress", route: "#/resultados" },
  { key: "ajustes", label: "Ajustes", icon: "settings", route: "#/ajustes" },
];

const STUDENT_NAV = [
  { key: "inicio", label: "Inicio", icon: "dashboard", route: "#/" },
  { key: "examenes", label: "Mis pruebas", icon: "exams", route: "#/examenes" },
  { key: "resultados", label: "Mis resultados", icon: "progress", route: "#/resultados" },
  { key: "ajustes", label: "Ajustes", icon: "settings", route: "#/ajustes" },
];

export const navFor = () => (isAdmin() ? ADMIN_NAV : canTeach() ? TEACHER_NAV : STUDENT_NAV);

function avatar(p) {
  if (p?.avatar_url) return `<img class="avatar" src="${esc(p.avatar_url)}" alt="">`;
  const initial = esc((p?.full_name || p?.email || "?")[0].toUpperCase());
  return `<span class="avatar avatar-initial">${initial}</span>`;
}

function sidebar(active) {
  const p = session.profile;
  const roleCls = isAdmin() ? "admin" : canTeach() ? "teacher" : "student";
  return `
  <aside class="sidebar" id="sidebar">
    <div class="brand">
      <img src="${LOGO}" alt="Golden Eagle Academy">
      <div><span class="brand-name">Academy</span><span class="brand-sub">Golden Eagle</span></div>
    </div>
    <nav class="nav">
      ${navFor().map((n) => `<a href="${n.route}" class="${active === n.key ? "active" : ""}">${I[n.icon]}<span>${n.label}</span></a>`).join("")}
    </nav>
    <div class="sidebar-spacer"></div>
    <div class="role-card">
      <span class="role-badge ${roleCls}">${roleLabel()}</span>
      <div class="role-name">${esc(p?.full_name || p?.email || "")}</div>
    </div>
  </aside>`;
}

function topbar(title) {
  const p = session.profile;
  return `
  <header class="topbar">
    <div class="topbar-title"><h2>${esc(title || "")}</h2></div>
    <div class="topbar-right">
      <div class="user">
        <div class="u-name"><b>${esc(p?.full_name || "")}</b><span>${p?.username ? "@" + esc(p.username) : ""}</span></div>
        ${avatar(p)}
      </div>
      <button class="icon-btn" id="logoutBtn" title="Cerrar sesión" aria-label="Cerrar sesión">${I.logout}</button>
    </div>
  </header>`;
}

export function shell(active, title, contentHTML) {
  return `
  <div class="mobile-bar">
    <button class="hamburger" id="hamburger" aria-label="Menú">${I.menu}</button>
    <img src="${LOGO}" alt=""><span class="brand-name">Golden Eagle</span>
  </div>
  <div class="app">
    ${sidebar(active)}
    <div class="scrim" id="scrim"></div>
    <div class="main">
      ${topbar(title)}
      <main class="content"><div class="container">${contentHTML}</div></main>
    </div>
  </div>`;
}
