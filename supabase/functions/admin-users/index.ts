// ============================================================================
// Edge Function: admin-users
// Gestión de usuarios reservada a administradores. Usa el rol de servicio para
// crear cuentas de Supabase Auth (username + clave), restablecer claves y
// cambiar roles. SIEMPRE verifica que quien llama sea admin (is_admin) antes de
// cualquier operación.
//
// El acceso de la app es por NOMBRE DE USUARIO. Por debajo, GoTrue exige un
// email: se usa un email SINTÉTICO interno `<usuario>@users.goldeneagle.local`
// que nunca se muestra ni se pide.
//
// Acciones (POST { action, ... }):
//   - "create":         { username, password, full_name?, role? } -> crea la cuenta
//   - "reset_password":  { user_id, password }                    -> nueva clave (forzar cambio)
//   - "set_role":        { user_id, role }                        -> cambia el rol
//   - "list":            {}                                       -> lista de perfiles
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Debe coincidir con USERNAME_EMAIL_DOMAIN del frontend (js/config.js).
const USERNAME_EMAIL_DOMAIN = "users.goldeneagle.local";
const ROLES = ["admin", "teacher", "student"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// Normaliza un nombre de usuario: minúsculas, sin espacios, solo [a-z0-9._-].
function normUsername(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase().replace(/\s+/g, "");
}
const isValidUsername = (u: string) => /^[a-z0-9._-]{3,32}$/.test(u);
const emailFor = (username: string) => `${username}@${USERNAME_EMAIL_DOMAIN}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) return json({ error: "No autenticado" }, 401);

  // Identifica al usuario que llama con su JWT.
  const asUser = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userErr } = await asUser.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "Sesión inválida" }, 401);
  const callerId = userData.user.id;

  // Cliente con rol de servicio para las operaciones privilegiadas.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Verifica que quien llama sea admin (defensa real, no solo en el cliente).
  const { data: isAdmin, error: adminErr } = await admin.rpc("is_admin", { uid: callerId });
  if (adminErr) return json({ error: "No se pudo verificar el rol", detail: String(adminErr.message) }, 500);
  if (!isAdmin) return json({ error: "Solo un administrador puede gestionar usuarios." }, 403);

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  const action = payload?.action;

  try {
    if (action === "create") return await createUser(admin, payload);
    if (action === "reset_password") return await resetPassword(admin, payload);
    if (action === "set_role") return await setRole(admin, callerId, payload);
    if (action === "list") return await listUsers(admin);
    return json({ error: "Acción desconocida" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "Error interno", detail: String(e) }, 500);
  }
});

// ---------------------------------------------------------------------------
async function createUser(admin: any, p: any) {
  const username = normUsername(p.username);
  const password = String(p.password ?? "");
  const fullName = String(p.full_name ?? "").trim() || username;
  const role = ROLES.includes(p.role) ? p.role : "student";

  if (!isValidUsername(username)) {
    return json({ error: "Usuario inválido: usa 3–32 caracteres [a-z, 0-9, . _ -]." }, 400);
  }
  if (password.length < 8) {
    return json({ error: "La clave debe tener al menos 8 caracteres." }, 400);
  }

  // ¿Ya existe ese username?
  const { data: dupe } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
  if (dupe) return json({ error: "Ese nombre de usuario ya existe." }, 409);

  const { data: created, error } = await admin.auth.admin.createUser({
    email: emailFor(username),
    password,
    email_confirm: true,
    user_metadata: { username, full_name: fullName },
  });
  if (error) return json({ error: "No se pudo crear la cuenta.", detail: error.message }, 400);

  const newId = created.user.id;

  // Asegura el profile (por si el trigger no está activo) con rol y bandera de
  // cambio de clave obligatorio en el primer ingreso.
  await admin.from("profiles").upsert(
    { id: newId, email: emailFor(username), username, full_name: fullName, role, must_change_password: true },
    { onConflict: "id" },
  );

  return json({ ok: true, user: { id: newId, username, full_name: fullName, role } });
}

// ---------------------------------------------------------------------------
async function resetPassword(admin: any, p: any) {
  const userId = String(p.user_id ?? "");
  const password = String(p.password ?? "");
  if (!userId) return json({ error: "user_id requerido" }, 400);
  if (password.length < 8) return json({ error: "La clave debe tener al menos 8 caracteres." }, 400);

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return json({ error: "No se pudo restablecer la clave.", detail: error.message }, 400);

  // Fuerza el cambio en el próximo ingreso.
  await admin.from("profiles").update({ must_change_password: true }).eq("id", userId);
  return json({ ok: true });
}

// ---------------------------------------------------------------------------
async function setRole(admin: any, callerId: string, p: any) {
  const userId = String(p.user_id ?? "");
  const role = p.role;
  if (!userId) return json({ error: "user_id requerido" }, 400);
  if (!ROLES.includes(role)) return json({ error: "Rol inválido." }, 400);

  // Reutiliza la RPC admin_set_role (valida admin + no quitar el último admin).
  // Se invoca con el JWT de servicio, así que replicamos su regla del último
  // admin aquí y aplicamos el cambio con el rol de servicio.
  if (role !== "admin") {
    const { data: target } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
    if (target?.role === "admin") {
      const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
      if ((count ?? 0) <= 1) return json({ error: "No puedes quitar el último administrador del sistema." }, 409);
    }
  }
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) return json({ error: "No se pudo cambiar el rol.", detail: error.message }, 400);
  return json({ ok: true });
}

// ---------------------------------------------------------------------------
async function listUsers(admin: any) {
  const { data, error } = await admin
    .from("profiles")
    .select("id, username, full_name, role, must_change_password, created_at")
    .order("role").order("username");
  if (error) return json({ error: "No se pudo listar.", detail: error.message }, 500);
  return json({ users: data });
}
