# Puesta en marcha — Golden Eagle Academy

La aplicación es una **PWA web** (sin paso de compilación) con **Supabase** como
backend (autenticación con Google, base de datos PostgreSQL con RLS y una Edge
Function que sirve las preguntas al azar y corrige en el servidor).

## 1. Crear el proyecto Supabase

1. Entra en <https://supabase.com> y crea un proyecto.
2. Ve a **Project Settings → API** y copia:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public key**

## 2. Crear el esquema de la base de datos

En el panel de Supabase abre **SQL Editor** y ejecuta el contenido de
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

Esto crea las tablas (`profiles`, `courses`, `enrollments`, `modules`,
`questions`, `assignments`, `attempts`), las políticas de seguridad (RLS) y los
triggers. **El banco de preguntas nunca es legible por los alumnos.**

## 3. Activar el login con Google

1. En Supabase: **Authentication → Providers → Google → Enable**.
2. Crea las credenciales OAuth en Google Cloud Console
   (<https://console.cloud.google.com/apis/credentials>) y pega el *Client ID* y
   *Client Secret* en Supabase.
3. En **Authorized redirect URIs** de Google añade la que indica Supabase
   (`https://xxxx.supabase.co/auth/v1/callback`).
4. En Supabase **Authentication → URL Configuration → Redirect URLs** añade la
   URL de tu sitio (p.ej. `https://<usuario>.github.io/GoldenTest/` y
   `http://localhost:8080` para desarrollo).

El login con **correo/contraseña** funciona sin configuración adicional.

## 4. Desplegar la Edge Function

Con la [CLI de Supabase](https://supabase.com/docs/guides/cli):

```bash
supabase login
supabase link --project-ref <tu-project-ref>
supabase functions deploy exam
```

La función usa `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`,
que Supabase inyecta automáticamente en las Edge Functions.

## 5. Configurar el frontend

Edita [`js/config.js`](js/config.js) y pega tu URL y anon key:

```js
export const SUPABASE_URL = "https://xxxx.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOi...";
```

> Alternativa sin tocar el repo: define `window.GE_CONFIG = { SUPABASE_URL, SUPABASE_ANON_KEY }`
> antes de cargar la app (por ejemplo en un `<script>` en `index.html`).

La **anon key es pública** por diseño (la seguridad la aplica RLS), así que no
hay problema en commitearla.

## 6. Crear el primer profesor

Regístrate en la app (con Google o correo). Luego, en el **SQL Editor**:

```sql
update public.profiles set role = 'teacher' where email = 'tu@correo.com';
```

Vuelve a entrar y verás el panel de profesor.

## 7. Cargar un banco de preguntas

Desde el panel de profesor puedes crear preguntas una a una o **pegar en lote**
(formato JSON o CSV). También puedes insertarlas por SQL:

```sql
insert into public.questions (module_id, prompt, options, correct_index, explanation)
values ('<module_id>', '¿Pregunta?', '["A","B","C","D"]', 0, 'Explicación.');
```

## Desarrollo local

Un service worker necesita HTTP(S):

```bash
python3 -m http.server 8080
# abre http://localhost:8080
```

## Seguridad del examen (importante)

El bloqueo de capturas de pantalla y de cambio de app es **de mejor esfuerzo**
en la web: pantalla completa obligatoria, detección de salida de la app (que
marca o autoentrega el intento), y bloqueo de copiar/menú contextual. Un
navegador **no** puede impedir de verdad una captura ni una foto externa. Para
un bloqueo real se necesitaría empaquetar la PWA en una app nativa Android
(Capacitor con `FLAG_SECURE` + modo kiosco). Ver `ARCHITECTURE.md`.
