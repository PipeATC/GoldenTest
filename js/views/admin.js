import { I, esc, toast, modal, $, $$ } from "../ui.js";
import { render } from "../render.js";
import { session } from "../auth.js";
import * as api from "../api.js";

const errorBox = (e) => `<div class="empty"><h2>Ocurrió un problema</h2><p>${esc(e.message || e)}</p></div>`;

const ROLES = [
  { value: "admin",   label: "Administrador" },
  { value: "teacher", label: "Profesor" },
  { value: "student", label: "Alumno" },
];
const roleName = (r) => ({ admin: "Administrador", teacher: "Profesor", student: "Alumno" }[r] || r);
const roleBadge = (r) => `<span class="role-badge ${esc(r)}">${esc(roleName(r))}</span>`;

/* ============================== Gestión de usuarios ============================== */
export async function adminUsers() {
  render("usuarios", "Usuarios", `<div class="empty">Cargando…</div>`);
  let profiles = [];
  try { profiles = await api.listAllProfiles(); }
  catch (e) { return render("usuarios", "Usuarios", errorBox(e)); }

  const admins   = profiles.filter((p) => p.role === "admin").length;
  const teachers = profiles.filter((p) => p.role === "teacher").length;
  const students = profiles.filter((p) => p.role === "student").length;

  const rows = profiles.map((p) => {
    const isSelf = p.id === session.user.id;
    const opts = ROLES.map((r) => `<option value="${r.value}" ${p.role === r.value ? "selected" : ""}>${r.label}</option>`).join("");
    return `
      <tr data-uid="${esc(p.id)}">
        <td>
          <div class="u-cell">
            <b>${esc(p.full_name || "—")}</b>
            <span class="sub">@${esc(p.username || "—")}${p.must_change_password ? ` · <span class="tag-warn">clave pendiente</span>` : ""}</span>
          </div>
        </td>
        <td>${roleBadge(p.role)}${isSelf ? ` <span class="sub">(tú)</span>` : ""}</td>
        <td>
          <div class="role-editor">
            <select class="role-select" data-uid="${esc(p.id)}" data-current="${esc(p.role)}" aria-label="Rol de ${esc(p.username)}">${opts}</select>
            <button class="btn btn-primary sm" data-save="${esc(p.id)}" disabled>Guardar</button>
            <button class="btn btn-ghost sm" data-reset="${esc(p.id)}" data-username="${esc(p.username || "")}">Clave…</button>
          </div>
        </td>
      </tr>`;
  }).join("");

  const html = `
    <div class="page-head">
      <div class="head-row">
        <h1>Gestión de usuarios</h1>
        <button class="btn btn-gold" id="newUserBtn">${I.plus} Nuevo usuario</button>
      </div>
      <p>Crea cuentas (usuario + clave) y asigna roles. Un <b>administrador</b> gestiona usuarios y tiene acceso a todo lo de profesor; un <b>profesor</b> gestiona sus cursos; un <b>alumno</b> rinde exámenes.</p>
    </div>

    <div class="stats">
      <div class="stat"><div class="stat-top"><span class="stat-label">Administradores</span><span class="stat-emblem gold">${I.shield}</span></div><div class="stat-value">${admins}</div></div>
      <div class="stat"><div class="stat-top"><span class="stat-label">Profesores</span><span class="stat-emblem navy">${I.users}</span></div><div class="stat-value">${teachers}</div></div>
      <div class="stat"><div class="stat-top"><span class="stat-label">Alumnos</span><span class="stat-emblem ghost">${I.medal}</span></div><div class="stat-value">${students}</div></div>
    </div>

    <div class="note"><span>${I.info}</span><div><b>Regla de seguridad</b><p class="hint" style="margin-top:2px">No se puede quitar el último administrador. Las cuentas nuevas y las claves restablecidas exigen cambiar la clave en el primer ingreso. La validación real la hace el servidor.</p></div></div>

    <div class="table-wrap" style="margin-top:16px">
      <table class="data-table">
        <thead><tr><th>Usuario</th><th>Rol actual</th><th>Acciones</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="3" class="empty small">Sin usuarios.</td></tr>`}</tbody>
      </table>
    </div>`;
  render("usuarios", "Usuarios", html);

  $("#newUserBtn").onclick = () => promptNewUser();

  // Habilita "Guardar" solo cuando el rol seleccionado cambia.
  $$(".role-select").forEach((sel) => {
    const btn = $(`[data-save="${CSS.escape(sel.dataset.uid)}"]`);
    sel.onchange = () => { if (btn) btn.disabled = sel.value === sel.dataset.current; };
  });

  $$("[data-save]").forEach((btn) => btn.onclick = async () => {
    const uid = btn.dataset.save;
    const sel = $(`.role-select[data-uid="${CSS.escape(uid)}"]`);
    btn.disabled = true;
    try {
      await api.adminSetRole(uid, sel.value);
      toast("Rol actualizado.");
      adminUsers();
    } catch (e) { toast(e.message || "No se pudo cambiar el rol."); btn.disabled = false; }
  });

  $$("[data-reset]").forEach((btn) => btn.onclick = () => promptResetPassword(btn.dataset.reset, btn.dataset.username));
}

/* ---------- Crear usuario ---------- */
async function promptNewUser() {
  // Se capturan los valores dentro de onConfirm (antes de que el modal se cierre).
  let vals = null;
  const ok = await modal({
    title: "Nuevo usuario",
    body: `
      <label class="fld">Nombre completo<input id="u_name" type="text" placeholder="p.ej. Ana Pérez"></label>
      <label class="fld">Nombre de usuario<input id="u_user" type="text" autocapitalize="none" spellcheck="false" placeholder="ana.perez"></label>
      <div class="grid2">
        <label class="fld">Clave inicial<input id="u_pass" type="text" placeholder="mínimo 8 caracteres"></label>
        <label class="fld">Rol
          <select id="u_role">
            <option value="student" selected>Alumno</option>
            <option value="teacher">Profesor</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
      </div>
      <p class="hint">Usuario: 3–32 caracteres [a-z, 0-9, . _ -]. El usuario deberá cambiar la clave en su primer ingreso.</p>`,
    confirmLabel: "Crear usuario",
    onConfirm: (back) => {
      vals = {
        full_name: back.querySelector("#u_name").value.trim(),
        username: back.querySelector("#u_user").value.trim().toLowerCase(),
        password: back.querySelector("#u_pass").value,
        role: back.querySelector("#u_role").value,
      };
    },
  });
  if (!ok || !vals) return;
  const { full_name, username, password, role } = vals;
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) return toast("Usuario inválido: 3–32 caracteres [a-z, 0-9, . _ -].");
  if (password.length < 8) return toast("La clave debe tener al menos 8 caracteres.");
  try {
    await api.adminCreateUser(username, password, full_name || username, role);
    toast(`Usuario @${username} creado como ${roleName(role)}.`);
    adminUsers();
  } catch (e) { toast(e.message || "No se pudo crear el usuario."); }
}

/* ---------- Restablecer clave ---------- */
async function promptResetPassword(userId, username) {
  let password = null;
  const ok = await modal({
    title: `Restablecer clave de @${username}`,
    body: `
      <label class="fld">Clave nueva<input id="r_pass" type="text" placeholder="mínimo 8 caracteres"></label>
      <p class="hint">El usuario deberá cambiarla en su próximo ingreso.</p>`,
    confirmLabel: "Restablecer",
    onConfirm: (back) => { password = back.querySelector("#r_pass").value; },
  });
  if (!ok || password == null) return;
  if (password.length < 8) return toast("La clave debe tener al menos 8 caracteres.");
  try {
    await api.adminResetPassword(userId, password);
    toast("Clave restablecida.");
  } catch (e) { toast(e.message || "No se pudo restablecer la clave."); }
}
