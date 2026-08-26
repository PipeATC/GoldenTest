// Configuración de Supabase.
// Rellena estos valores (Project Settings → API) o define window.GE_CONFIG
// antes de cargar la app. La anon key es pública por diseño (RLS protege todo).
const w = (typeof window !== "undefined" && window.GE_CONFIG) || {};

export const SUPABASE_URL = w.SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = w.SUPABASE_ANON_KEY || "";

export const isConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
