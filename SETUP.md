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

En el panel de Supabase abre **SQL Editor** y ejecuta, en orden, el contenido de:

1. [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — tablas,
   políticas (RLS) y triggers.
2. [`supabase/migrations/0002_security.sql`](supabase/migrations/0002_security.sql) —
   configuración de seguridad por módulo (código del profesor, acción ante salida)
   y habilitación de **Realtime** en `attempts` para el monitor en vivo.
3. [`supabase/migrations/0003_rbac.sql`](supabase/migrations/0003_rbac.sql) — control
   de acceso por **3 roles** (`admin`, `teacher`, `student`): agrega el rol `admin`,
   los helpers `is_admin`/`teaches_student`, la función `admin_set_role` y las
   políticas de acceso total para el administrador. También **promueve al primer
   admin** (`felipe.loyolamejias@gmail.com`) de forma idempotente.

> La migración 0003 es idempotente: puedes ejecutarla varias veces. Si la aplicas
> con `supabase db push` (una sola transacción) y ves el aviso *"Bootstrap admin
> diferido"*, vuelve a ejecutarla o corre la promoción manual del paso 6; esto se
> debe a que PostgreSQL no permite usar un valor de enum recién creado en la misma
> transacción. En el **SQL Editor** de Supabase se aplica sin problema en una pasada.

> El monitor en vivo del profesor usa Supabase Realtime. La migración 0002 ya
> agrega `attempts` a la publicación `supabase_realtime`; si lo prefieres, también
> puedes activarlo desde el panel en **Database → Replication**. Aunque no lo
> actives, el monitor se refresca por sondeo cada 15 segundos.

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

## 6. Crear el primer administrador

La app usa **3 roles**:

| Rol       | Puede |
|-----------|-------|
| `admin`   | Gestiona **usuarios y sus roles** + todo lo del profesor. |
| `teacher` | Gestiona **sus** cursos, módulos, banco de preguntas y asignaciones; ve a sus alumnos. |
| `student` | Rinde exámenes. **Nunca** lee el banco de preguntas. |

Los usuarios nuevos entran siempre como **`student`**. El primer administrador se
crea de una de estas dos formas:

- **Automático (recomendado):** la migración `0003_rbac.sql` ya promueve a
  `felipe.loyolamejias@gmail.com` a `admin`. Basta con que esa persona se registre
  (con Google o correo) y luego se aplique/re-aplique la migración.
- **Manual (cualquier otro correo):** regístrate en la app y luego, en el
  **SQL Editor**:

  ```sql
  update public.profiles set role = 'admin' where email = 'tu@correo.com';
  ```

Vuelve a entrar y verás el **panel de administración**.

### Asignar roles desde la app

Ya **no** se cambian los roles a mano por SQL. Desde el **panel de admin →
Usuarios**, el administrador ve todos los perfiles (correo, nombre y rol) y cambia
el rol de cualquiera con un selector. Ese cambio pasa por la función
`admin_set_role`, que se valida en el servidor:

- solo un `admin` puede cambiar roles;
- no se puede quitar el **último** administrador del sistema.

Así, para crear un profesor, promuévelo desde el panel de usuarios (Alumno →
Profesor). El intento de un profesor o alumno de cambiar su propio rol se bloquea
en la base de datos (trigger `guard_profile_role`).

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
