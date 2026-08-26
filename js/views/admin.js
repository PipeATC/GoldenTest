import { I, esc, toast, $, $$ } from "../ui.js";
import { render } from "../render.js";
import { session } from "../auth.js";
import * as api from "../api.js";

const errorBox = (e) => `<div class="empty"><h2>Ocurrió un problema</h2><p>${esc(e.message || e)}</p></div>`;

const ROLES = [
  { value: "admin",   label: "Administrador" },
  { value: "teacher", label: "Profesor" },
  { value: "student", label: "Alumno" },
];

const roleBadge = (r) =>
  `<span class="role-badge ${esc(r)}">${esc({ admin: "Administrador", teacher: "Profesor", student: "Alumno" }[r] || r)}</span>`;

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
            <span class="sub">${esc(p.email)}</span>
          </div>
        </td>
        <td>${roleBadge(p.role)}${isSelf ? ` <span class="sub">(tú)</span>` : ""}</td>
        <td>
          <div class="role-editor">
            <select class="role-select" data-uid="${esc(p.id)}" data-current="${esc(p.role)}" aria-label="Rol de ${esc(p.email)}">${opts}</select>
            <button class="btn btn-primary sm" data-save="${esc(p.id)}" disabled>Guardar</button>
          </div>
        </td>
      </tr>`;
  }).join("");

  const html = `
    <div class="page-head">
      <h1>Gestión de usuarios</h1>
      <p>Asigna roles. Un <b>administrador</b> gestiona usuarios y tiene acceso a todo lo de profesor; un <b>profesor</b> gestiona sus cursos; un <b>alumno</b> rinde exámenes.</p>
    </div>

    <div class="stats">
      <div class="stat"><div class="stat-top"><span class="stat-label">Administradores</span><span class="stat-emblem gold">${I.shield}</span></div><div class="stat-value">${admins}</div></div>
      <div class="stat"><div class="stat-top"><span class="stat-label">Profesores</span><span class="stat-emblem navy">${I.users}</span></div><div class="stat-value">${teachers}</div></div>
      <div class="stat"><div class="stat-top"><span class="stat-label">Alumnos</span><span class="stat-emblem ghost">${I.medal}</span></div><div class="stat-value">${students}</div></div>
    </div>

    <div class="note"><span>${I.info}</span><div><b>Regla de seguridad</b><p class="hint" style="margin-top:2px">No se puede quitar el último administrador. El cambio de rol lo valida el servidor (RPC <code>admin_set_role</code>).</p></div></div>

    <div class="table-wrap" style="margin-top:16px">
      <table class="data-table">
        <thead><tr><th>Usuario</th><th>Rol actual</th><th>Cambiar rol</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="3" class="empty small">Sin usuarios.</td></tr>`}</tbody>
      </table>
    </div>`;
  render("usuarios", "Usuarios", html);

  // Habilita "Guardar" solo cuando el rol seleccionado cambia.
  $$(".role-select").forEach((sel) => {
    const btn = $(`[data-save="${CSS.escape(sel.dataset.uid)}"]`);
    sel.onchange = () => { if (btn) btn.disabled = sel.value === sel.dataset.current; };
  });

  $$("[data-save]").forEach((btn) => btn.onclick = async () => {
    const uid = btn.dataset.save;
    const sel = $(`.role-select[data-uid="${CSS.escape(uid)}"]`);
    const newRole = sel.value;
    btn.disabled = true;
    try {
      await api.adminSetRole(uid, newRole);
      toast("Rol actualizado.");
      adminUsers();  // recarga para reflejar el estado real
    } catch (e) {
      // Mensajes del servidor (p. ej. "No puedes quitar el último administrador").
      toast(e.message || "No se pudo cambiar el rol.");
      btn.disabled = false;
    }
  });
}
