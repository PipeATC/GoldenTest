import { I, esc, toast, $ } from "../ui.js";
import { signInWithUsername } from "../auth.js";
import { isConfigured } from "../config.js";

const LOGO = "assets/logo-eagle.png";

export function renderLogin(root) {
  if (!isConfigured()) return renderSetupNeeded(root);

  root.innerHTML = `
  <div class="auth-wrap">
    <div class="auth-card">
      <img class="auth-logo" src="${LOGO}" alt="Golden Eagle Academy">
      <h1>Golden Eagle Academy</h1>
      <p class="auth-sub">Inicia sesión con tu usuario</p>

      <form id="authForm" class="auth-form">
        <label>Nombre de usuario<input type="text" id="username" required autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="tu.usuario"></label>
        <label>Clave<input type="password" id="password" required autocomplete="current-password"></label>
        <button class="btn btn-primary btn-block" type="submit">Entrar</button>
      </form>

      <p class="auth-note">${I.shield} El acceso lo gestiona un administrador. Si no tienes usuario o clave, solicítalos.</p>
    </div>
  </div>`;

  $("#authForm").onsubmit = async (e) => {
    e.preventDefault();
    const username = $("#username").value.trim();
    const password = $("#password").value;
    const btn = e.target.querySelector("button[type=submit]");
    if (!username || !password) return;
    btn.disabled = true;
    try {
      const { error } = await signInWithUsername(username, password);
      if (error) throw error;
      // El cambio de sesión re-enruta automáticamente (onAuthChange).
    } catch (err) {
      const msg = /invalid login credentials/i.test(err.message || "")
        ? "Usuario o clave incorrectos."
        : "Error: " + (err.message || err);
      toast(msg);
      btn.disabled = false;
    }
  };
}

function renderSetupNeeded(root) {
  root.innerHTML = `
  <div class="auth-wrap">
    <div class="auth-card setup">
      <img class="auth-logo" src="${LOGO}" alt="Golden Eagle Academy">
      <h1>Configuración pendiente</h1>
      <p class="auth-sub">Falta conectar Supabase para habilitar el login y los datos.</p>
      <ol class="setup-steps">
        <li>Crea un proyecto en <b>supabase.com</b>.</li>
        <li>Ejecuta <code>supabase/migrations/0001_init.sql</code> en el SQL Editor.</li>
        <li>Pega tu <b>URL</b> y <b>anon key</b> en <code>js/config.js</code>.</li>
        <li>Despliega la Edge Function: <code>supabase functions deploy exam</code>.</li>
      </ol>
      <p class="auth-note">${I.info} Guía completa en <code>SETUP.md</code>.</p>
    </div>
  </div>`;
}
