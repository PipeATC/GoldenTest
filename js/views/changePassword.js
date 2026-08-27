import { I, esc, toast, $ } from "../ui.js";
import { changePassword, signOut, username } from "../auth.js";

const LOGO = "assets/logo-eagle.png";

// Pantalla de cambio de clave obligatorio (primer ingreso o clave restablecida
// por el administrador). Bloquea el resto de la app hasta cambiarla.
export function renderChangePassword(root) {
  root.innerHTML = `
  <div class="auth-wrap">
    <div class="auth-card">
      <img class="auth-logo" src="${LOGO}" alt="Golden Eagle Academy">
      <h1>Cambia tu clave</h1>
      <p class="auth-sub">Por seguridad, define una clave nueva para <b>${esc(username())}</b>.</p>

      <form id="pwForm" class="auth-form">
        <label>Clave nueva<input type="password" id="pw1" required minlength="8" autocomplete="new-password" placeholder="mínimo 8 caracteres"></label>
        <label>Repite la clave<input type="password" id="pw2" required minlength="8" autocomplete="new-password"></label>
        <button class="btn btn-primary btn-block" type="submit">Guardar y continuar</button>
      </form>

      <p class="auth-switch"><a href="#" id="logoutLink">Cerrar sesión</a></p>
      <p class="auth-note">${I.shield} No podrás usar la app hasta cambiar la clave.</p>
    </div>
  </div>`;

  $("#logoutLink").onclick = (e) => { e.preventDefault(); signOut(); };

  $("#pwForm").onsubmit = async (e) => {
    e.preventDefault();
    const pw1 = $("#pw1").value, pw2 = $("#pw2").value;
    const btn = e.target.querySelector("button[type=submit]");
    if (pw1.length < 8) return toast("La clave debe tener al menos 8 caracteres.");
    if (pw1 !== pw2) return toast("Las claves no coinciden.");
    btn.disabled = true;
    try {
      await changePassword(pw1);   // baja la bandera y re-emite auth → re-enruta
      toast("Clave actualizada.");
    } catch (err) {
      toast("Error: " + (err.message || err));
      btn.disabled = false;
    }
  };
}
