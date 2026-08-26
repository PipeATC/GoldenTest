import { supabase } from "./lib/supabase.js";

// Estado de sesión: usuario de auth + su profile (con rol).
export const session = { user: null, profile: null };

const listeners = new Set();
export const onAuthChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((fn) => fn(session));

// Carga (o crea) el profile del usuario actual y enlaza matrículas pendientes.
async function loadProfile() {
  if (!session.user) { session.profile = null; return; }

  let { data: profile } = await supabase
    .from("profiles").select("*").eq("id", session.user.id).maybeSingle();

  // Red de seguridad si el trigger no creó el profile.
  if (!profile) {
    const meta = session.user.user_metadata || {};
    const insert = {
      id: session.user.id,
      email: session.user.email,
      full_name: meta.full_name || meta.name || session.user.email.split("@")[0],
      avatar_url: meta.avatar_url || null,
    };
    const { data } = await supabase.from("profiles").insert(insert).select("*").single();
    profile = data;
  }

  // Enlaza matrículas creadas por correo antes de existir el profile.
  try { await supabase.rpc("link_my_enrollments"); } catch { /* opcional */ }

  session.profile = profile;
}

export async function initAuth() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  session.user = data?.session?.user ?? null;
  await loadProfile();

  supabase.auth.onAuthStateChange(async (_event, s) => {
    session.user = s?.user ?? null;
    await loadProfile();
    emit();
  });
}

export async function signInWithGoogle() {
  const redirectTo = location.origin + location.pathname;
  return supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
}

export async function signInWithEmail(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email, password, fullName) {
  return supabase.auth.signUp({
    email, password,
    options: { data: { full_name: fullName } },
  });
}

export async function signOut() {
  await supabase.auth.signOut();
  session.user = null;
  session.profile = null;
  emit();
}

// Helpers de rol leídos del profile. Un admin tiene acceso a TODO lo de
// profesor además de la gestión de usuarios.
export const role = () => session.profile?.role || "student";
export const isAdmin = () => role() === "admin";
export const isTeacher = () => role() === "teacher";
export const isStudent = () => role() === "student";
// ¿Puede ver la UI de profesor? (profesor o admin)
export const canTeach = () => isTeacher() || isAdmin();

export const roleLabel = () => ({ admin: "Administrador", teacher: "Profesor", student: "Alumno" }[role()] || "Alumno");
