-- ============================================================================
-- Configuración de seguridad por módulo.
--   proctor_code:    código que el profesor ingresa para reanudar un examen
--                    congelado. Se valida SIEMPRE en el servidor (Edge Function
--                    `exam` → resume); nunca se envía al cliente.
--   incident_action: qué hacer ante una incidencia de seguridad:
--                    'flag'   → solo registrar
--                    'lock'   → congelar hasta que el profesor ingrese el código
--                    'submit' → autoentregar al superar max_incidents
--   max_incidents:   umbral para la acción 'submit'.
-- ============================================================================
alter table public.modules add column if not exists proctor_code text;
alter table public.modules add column if not exists incident_action text not null default 'lock';
alter table public.modules add column if not exists max_incidents int not null default 3;

-- Habilita Realtime en `attempts` para el monitor en vivo del profesor.
-- (RLS sigue aplicando: el profesor solo recibe los intentos de sus módulos.)
do $$ begin
  alter publication supabase_realtime add table public.attempts;
exception when others then null;
end $$;
