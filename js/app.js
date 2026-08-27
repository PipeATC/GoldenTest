// Golden Eagle Academy — Bootstrap y router (módulos ES).
// Login con Supabase, enrutado por hash con guardas de rol (profesor/alumno).
import { supabase } from "./lib/supabase.js";
import { initAuth, onAuthChange, session, isAdmin, canTeach, mustChangePassword } from "./auth.js";
import { renderLogin } from "./views/login.js";
import { renderChangePassword } from "./views/changePassword.js";
import { settingsView } from "./views/settings.js";
import * as S from "./views/student.js";
import * as T from "./views/teacher.js";
import * as A from "./views/admin.js";
import { $ } from "./ui.js";

const root = () => document.getElementById("root");

/* ----------------------------- Router ----------------------------- */
function route() {
  // Sin sesión → login (o pantalla de configuración si falta Supabase).
  if (!session.user) return renderLogin(root());

  // Cambio de clave obligatorio (primer ingreso o clave restablecida): bloquea
  // toda la app hasta que se cambie.
  if (mustChangePassword()) return renderChangePassword(root());

  const hash = location.hash || "#/";
  const [path, arg] = hash.replace(/^#\//, "").split("/");

  // Rutas compartidas
  if (path === "ajustes") return settingsView();

  // Admin: gestión de usuarios + TODO lo de profesor. Aterriza en el panel de
  // administración; el resto de rutas usan las vistas de profesor.
  if (isAdmin()) {
    if (path === "" || path === "usuarios") return A.adminUsers();
    return routeTeacher(path, arg);
  }

  // Profesor: sus cursos, módulos, banco y resultados.
  if (canTeach()) return routeTeacher(path, arg);

  // Alumno: rinde exámenes.
  return routeStudent(path, arg);
}

function routeTeacher(path, arg) {
  switch (path) {
    case "":
    case "inicio": return T.teacherDashboard();
    case "cursos": return T.teacherCourses();
    case "curso": return T.teacherCourseDetail(decodeURIComponent(arg || ""));
    case "modulo": return T.teacherModuleDetail(decodeURIComponent(arg || ""));
    case "resultados": return T.teacherResults();
    default: return T.teacherDashboard();
  }
}

function routeStudent(path, arg) {
  switch (path) {
    case "":
    case "inicio": return S.studentDashboard();
    case "examenes": return S.studentExams();
    case "rendir": return S.studentRunExam(decodeURIComponent(arg || ""));
    case "resultado": return S.studentResult(decodeURIComponent(arg || ""));
    case "resultados": return S.studentResultsHub();
    default: return S.studentDashboard();
  }
}

/* ----------------------------- Eventos globales ----------------------------- */
window.addEventListener("hashchange", route);
window.addEventListener("resize", () => {
  if (window.innerWidth > 900) document.body.classList.remove("nav-open");
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  document.body.classList.remove("nav-open");
  const m = $(".modal-backdrop"); if (m) m.remove();
});

// Al cambiar la autenticación, volver al inicio y re-enrutar.
onAuthChange(() => {
  if (session.user && (location.hash === "" || location.hash === "#/")) route();
  else if (!session.user) renderLogin(root());
  else route();
});

/* ----------------------------- PWA ----------------------------- */
window.__deferredInstall = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); window.__deferredInstall = e; });
window.addEventListener("appinstalled", () => { window.__deferredInstall = null; });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => console.warn("SW:", err));
  });
}

/* ----------------------------- Init ----------------------------- */
(async function init() {
  if (!supabase) { renderLogin(root()); return; }  // muestra "configuración pendiente"
  await initAuth();
  route();
})();
