// Configuración de Supabase.
// Rellena estos valores (Project Settings → API) o define window.GE_CONFIG
// antes de cargar la app. La anon key es pública por diseño (RLS protege todo).
const w = (typeof window !== "undefined" && window.GE_CONFIG) || {};

export const SUPABASE_URL = w.SUPABASE_URL || "https://qiddbfmsvtbjnimhwloe.supabase.co";
export const SUPABASE_ANON_KEY = w.SUPABASE_ANON_KEY || "sb_publishable_aRJFjV4d4iHZecg2JAat0A_IRooXUNC";

export const isConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
