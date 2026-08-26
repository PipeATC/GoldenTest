import { I, esc, toast } from "../ui.js";
import { render } from "../render.js";
import { session, isStudent, roleLabel, signOut } from "../auth.js";

export function settingsView() {
  const p = session.profile || {};
  const installed = window.matchMedia("(display-mode: standalone)").matches;
  const html = `
    <div class="page-head"><h1>Ajustes</h1><p>Tu perfil y opciones de la aplicación.</p></div>
    <div class="card" style="padding:26px;max-width:640px;margin-top:20px">
      <h3 style="font-size:20px;margin-bottom:16px">Perfil</h3>
      <div class="rev-item"><span>Nombre</span><b>${esc(p.full_name || "—")}</b></div>
      <div class="rev-item"><span>Correo</span><b>${esc(p.email || "—")}</b></div>
      <div class="rev-item"><span>Rol</span><b>${roleLabel()}</b></div>
      <div class="rev-item"><span>App instalada</span><b>${installed ? "Sí" : "No"}</b></div>
      <div style="display:flex;gap:12px;margin-top:22px;flex-wrap:wrap">
        <button class="btn btn-gold" id="installBtn">${I.dashboard} Instalar app</button>
        <button class="btn btn-ghost" id="logoutBtn2">${I.logout} Cerrar sesión</button>
      </div>
      ${isStudent() ? `<p class="hint" style="margin-top:18px">${I.info} ¿Necesitas ser profesor? Pide a un administrador que cambie tu rol desde el panel de usuarios.</p>` : ""}
    </div>`;
  render("ajustes", "Ajustes", html);

  const ib = document.getElementById("installBtn");
  if (ib) ib.onclick = () => {
    if (window.__deferredInstall) { window.__deferredInstall.prompt(); }
    else toast("Usa el menú del navegador → “Instalar app” / “Añadir a pantalla de inicio”.");
  };
  const lo = document.getElementById("logoutBtn2");
  if (lo) lo.onclick = () => signOut();
}
