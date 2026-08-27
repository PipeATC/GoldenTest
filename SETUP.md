# Puesta en marcha — Golden Eagle Academy

La aplicación es una **PWA web** (sin paso de compilación) con **Supabase** como
backend (autenticación por usuario/clave, base de datos PostgreSQL con RLS y una Edge
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
   políticas de acceso total para el administrador.
4. [`supabase/migrations/0004_username_auth.sql`](supabase/migrations/0004_username_auth.sql) —
   acceso por **nombre de usuario + clave** (sin correo, sin Google): columnas
   `username` y `must_change_password` en `profiles`, matrículas por username, y
   **crea el primer administrador** (usuario `admin`, ver paso 6) de forma
   idempotente.

> Las migraciones 0003/0004 son idempotentes: puedes ejecutarlas varias veces. Si
> aplicas 0003 con `supabase db push` (una sola transacción) y ves el aviso
> *"Bootstrap admin diferido"*, vuelve a ejecutarla; se debe a que PostgreSQL no
> permite usar un valor de enum recién creado en la misma transacción. En el
> **SQL Editor** de Supabase ambas se aplican sin problema en una pasada.

> El monitor en vivo del profesor usa Supabase Realtime. La migración 0002 ya
> agrega `attempts` a la publicación `supabase_realtime`; si lo prefieres, también
> puedes activarlo desde el panel en **Database → Replication**. Aunque no lo
> actives, el monitor se refresca por sondeo cada 15 segundos.

Esto crea las tablas (`profiles`, `courses`, `enrollments`, `modules`,
`questions`, `assignments`, `attempts`), las políticas de seguridad (RLS) y los
triggers. **El banco de preguntas nunca es legible por los alumnos.**

## 3. Autenticación por usuario + clave

El acceso es por **nombre de usuario y clave**. **No se usa correo ni Google.**
No hay auto-registro: las cuentas las crea un administrador desde el panel de
usuarios. No necesitas configurar ningún proveedor OAuth.

Detalle técnico: por debajo se sigue usando Supabase Auth (proveedor *email*, que
está activo por defecto). Cada persona se guarda con un email **sintético interno**
`<usuario>@users.goldeneagle.local` que nunca se muestra ni se pide. Recomendado en
**Authentication → Providers → Email**:

- **Confirm email: OFF** (los emails son internos y no reciben correo; las cuentas
  se crean ya confirmadas de todos modos).
- **Allow new users to sign up: OFF** (defensa en profundidad: solo el admin crea
  cuentas, vía la función `admin-users` con rol de servicio).

## 4. Desplegar las Edge Functions

Con la [CLI de Supabase](https://supabase.com/docs/guides/cli):

```bash
supabase login
supabase link --project-ref <tu-project-ref>
supabase functions deploy exam
supabase functions deploy admin-users
```

- `exam`: sirve las preguntas al azar y corrige en el servidor.
- `admin-users`: gestión de usuarios (crear cuenta, restablecer clave, cambiar
  rol) reservada a administradores.

Ambas usan `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`, que
Supabase inyecta automáticamente en las Edge Functions.

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

**No hay auto-registro.** El primer administrador es:

| | |
|--------|--------|
| **Usuario** | `admin` |
| **Clave**   | `123456` |

> ⚠️ **Cambia esta clave en el primer ingreso.** La cuenta viene marcada para
> cambio de clave obligatorio: al entrar por primera vez, la app te pedirá una
> clave nueva (mínimo 8 caracteres) antes de dejarte usar nada.

Créalo por **cualquiera** de estas vías:

1. **Confiable — botón en la pantalla de login (recomendado).**
   Con las Edge Functions desplegadas (paso 4), abre la app y pulsa
   **“Primer arranque: crear administrador”**. Crea/repara la cuenta `admin`
   con clave `123456` usando la API oficial de Supabase. Se auto-deshabilita en
   cuanto existe un admin.

2. **Confiable — por API** (equivalente al botón), sustituyendo tu ref y anon key:

   ```bash
   curl -s -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/admin-users" \
     -H "Authorization: Bearer <ANON_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"action":"bootstrap","password":"123456"}'
   ```

3. **Best-effort — automático en la migración `0004`.** El seed SQL intenta crear
   `admin/123456` al aplicar la migración. Como el esquema interno de Supabase
   Auth varía entre versiones, **puede no habilitar el login**; si al entrar
   falla, usa la vía 1 o 2 (que sí son confiables).

Si prefieres promover a otra persona como primer admin, créala (vía panel) y
luego, por única vez, desde el **SQL Editor**:

```sql
update public.profiles set role = 'admin' where username = 'tu_usuario';
```

### Crear usuarios y asignar roles desde la app

Todo se hace desde el **panel de admin → Usuarios** (ya **no** por SQL):

- **Nuevo usuario:** el admin define nombre, **nombre de usuario**, una **clave
  inicial** y el **rol** (alumno / profesor / administrador). La cuenta se crea vía
  la función `admin-users` (rol de servicio) y exige cambiar la clave en el primer
  ingreso.
- **Cambiar rol:** con un selector por usuario (función `admin_set_role`). Solo un
  `admin` puede, y **no se puede quitar el último administrador**.
- **Restablecer clave:** el admin fija una clave nueva; el usuario deberá cambiarla
  en su próximo ingreso.

El intento de un profesor o alumno de cambiar su propio rol se bloquea en la base
de datos (trigger `guard_profile_role`).

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
