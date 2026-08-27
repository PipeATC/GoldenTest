// Configuración de Supabase.
// Rellena estos valores (Project Settings → API) o define window.GE_CONFIG
// antes de cargar la app. La anon key es pública por diseño (RLS protege todo).
const w = (typeof window !== "undefined" && window.GE_CONFIG) || {};

export const SUPABASE_URL = w.SUPABASE_URL || "https://qiddbfmsvtbjnimhwloe.supabase.co";
export const SUPABASE_ANON_KEY = w.SUPABASE_ANON_KEY || "sb_publishable_aRJFjV4d4iHZecg2JAat0A_IRooXUNC";

export const isConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Autenticación por NOMBRE DE USUARIO (sin correo). Por debajo, Supabase Auth
// exige un email: se usa un email sintético interno `<usuario>@<dominio>` que
// nunca se muestra ni se pide. Debe coincidir con el de la Edge Function
// `admin-users` (USERNAME_EMAIL_DOMAIN).
export const USERNAME_EMAIL_DOMAIN = "users.goldeneagle.local";
export const normalizeUsername = (u) =>
  String(u || "").trim().toLowerCase().replace(/\s+/g, "");
export const emailForUsername = (u) => `${normalizeUsername(u)}@${USERNAME_EMAIL_DOMAIN}`;
