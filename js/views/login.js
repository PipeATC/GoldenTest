import { I, esc, toast, $ } from "../ui.js";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "../auth.js";
import { isConfigured } from "../config.js";

const LOGO = "assets/logo-eagle.png";

export function renderLogin(root) {
  if (!isConfigured()) return renderSetupNeeded(root);

  let mode = "signin"; // signin | signup

  const draw = () => {
    root.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <img class="auth-logo" src="${LOGO}" alt="Golden Eagle Academy">
        <h1>Golden Eagle Academy</h1>
        <p class="auth-sub">${mode === "signin" ? "Inicia sesión para continuar" : "Crea tu cuenta"}</p>

        <button class="btn btn-google btn-block" id="googleBtn">${I.google}<span>Continuar con Google</span></button>
        <div class="auth-divider"><span>o con tu correo</span></div>

        <form id="authForm" class="auth-form">
          ${mode === "signup" ? `<label>Nombre completo<input type="text" id="fullName" required autocomplete="name"></label>` : ""}
          <label>Correo<input type="email" id="email" required autocomplete="email"></label>
          <label>Contraseña<input type="password" id="password" required minlength="6" autocomplete="${mode === "signin" ? "current-password" : "new-password"}"></label>
          <button class="btn btn-primary btn-block" type="submit">${mode === "signin" ? "Entrar" : "Registrarme"}</button>
        </form>

        <p class="auth-switch">
          ${mode === "signin"
            ? `¿No tienes cuenta? <a href="#" id="toSignup">Regístrate</a>`
            : `¿Ya tienes cuenta? <a href="#" id="toSignin">Inicia sesión</a>`}
        </p>
        <p class="auth-note">${I.shield} Los nuevos usuarios entran como <b>alumnos</b>. Un administrador asigna el rol de profesor.</p>
      </div>
    </div>`;

    $("#googleBtn").onclick = async () => {
      try { await signInWithGoogle(); }
      catch (e) { toast("No se pudo iniciar con Google: " + e.message); }
    };

    const swSignup = $("#toSignup"); if (swSignup) swSignup.onclick = (e) => { e.preventDefault(); mode = "signup"; draw(); };
    const swSignin = $("#toSignin"); if (swSignin) swSignin.onclick = (e) => { e.preventDefault(); mode = "signin"; draw(); };

    $("#authForm").onsubmit = async (e) => {
      e.preventDefault();
      const email = $("#email").value.trim();
      const password = $("#password").value;
      const btn = e.target.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        if (mode === "signin") {
          const { error } = await signInWithEmail(email, password);
          if (error) throw error;
        } else {
          const fullName = $("#fullName").value.trim();
          const { error } = await signUpWithEmail(email, password, fullName);
          if (error) throw error;
          toast("Cuenta creada. Si se requiere, confirma tu correo y vuelve a entrar.");
        }
      } catch (err) {
        toast("Error: " + (err.message || err));
        btn.disabled = false;
      }
    };
  };

  draw();
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
