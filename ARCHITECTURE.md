# Arquitectura — Golden Eagle Academy

Plataforma de exámenes con roles **profesor/alumno**, cursos, módulos, banco de
preguntas y pruebas seguras con selección **aleatoria por alumno**.

## Vista general

```
┌─────────────────────────── Frontend (PWA, módulos ES) ───────────────────────────┐
│  index.html → js/app.js (router por hash + guardas de rol)                        │
│    ├─ auth.js        sesión + rol (Supabase Auth, Google/email)                   │
│    ├─ api.js         acceso a datos (queries con RLS)                             │
│    ├─ security.js    bloqueo de examen "mejor esfuerzo"                           │
│    ├─ views/login    login / registro / setup                                    │
│    ├─ views/teacher  cursos · alumnos · banco de preguntas · asignar · resultados │
│    └─ views/student  mis pruebas · examen seguro · resultados                     │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                        │  HTTPS
┌──────────────────────────────────────▼───────────────────────────────────────────┐
│                                   Supabase                                         │
│   Auth (Google + email)                                                           │
│   PostgreSQL + RLS   profiles · courses · enrollments · modules · questions ·     │
│                      assignments · attempts                                       │
│   Edge Function `exam`  (ÚNICO que lee las respuestas correctas)                  │
│       - start:  elige N preguntas al azar por alumno, las devuelve SIN respuesta  │
│       - submit: corrige en el servidor y guarda el puntaje                        │
└───────────────────────────────────────────────────────────────────────────────────┘
```

## Modelo de datos

| Tabla | Rol | Descripción |
| --- | --- | --- |
| `profiles` | — | 1:1 con `auth.users`. Campo `role` (`teacher`/`student`). |
| `courses` | profesor | Curso creado por un profesor. |
| `enrollments` | profesor | Alumnos del curso (por correo; se enlazan al registrarse). |
| `modules` | profesor | Prueba: duración, `questions_per_exam`, nota de corte. |
| `questions` | profesor | Banco (p.ej. 200). **Nunca legible por alumnos.** |
| `assignments` | profesor | Asigna un módulo a un alumno con `opens_at`/`closes_at`. |
| `attempts` | alumno | Un intento por asignación: las 50 preguntas elegidas, respuestas y puntaje. |

## Seguridad de datos (por qué es seguro)

- **Row Level Security** en todas las tablas: cada usuario sólo ve lo suyo.
- El **banco de preguntas** sólo lo leen los profesores dueños del módulo. Los
  alumnos **no** pueden consultar `questions` (ni las respuestas correctas).
- Las **50 preguntas al azar** y la **corrección** las produce la Edge Function
  `exam` con el rol de servicio, autenticando antes al alumno con su JWT. Así el
  navegador nunca recibe la respuesta correcta hasta que entrega.
- Un **trigger** impide que un alumno se cambie el rol a profesor, y otro impide
  que altere el puntaje/estado de su intento.

## Selección aleatoria (50 de 200, única por alumno)

Al iniciar (`exam` → `start`), la función baraja los IDs del banco del módulo y
toma `questions_per_exam`. Los IDs quedan guardados en el `attempt`, de modo que
al reanudar se ven **las mismas** preguntas. Cada alumno obtiene su propio
subconjunto.

## Bloque horario

`assignments.opens_at` / `closes_at` definen la ventana. La función `start`
rechaza abrir la prueba fuera de ella; el cronómetro del cliente también respeta
`closes_at` además de la duración del módulo.

## Seguridad durante el examen (mejor esfuerzo, web)

`js/security.js` aplica, mientras dura la prueba:

- **Pantalla completa** obligatoria; salir queda registrado.
- Detección de **cambio de app/pestaña** (`visibilitychange`, `blur`): se cuenta
  y, tras N salidas, se **autoentrega**.
- Bloqueo de **menú contextual, selección y portapapeles**.
- Bloqueo de **atajos** (PrintScreen, F12, Ctrl+P/C/S/U…).
- Cada incidencia se guarda en `attempts.security_events` y el profesor la ve en
  la tabla de resultados.

> ⚠️ **Límite real de la web:** un navegador **no** puede impedir de verdad una
> captura de pantalla del sistema ni una foto con otro dispositivo. Lo anterior
> **disuade y registra**, no bloquea al 100%.

### Bloqueo real (fase 2, opcional): envoltorio nativo Android

Para impedir capturas y salidas de app de verdad, empaquetar esta misma PWA con
**Capacitor** en una app Android y:

- Activar `FLAG_SECURE` en la actividad → el sistema **bloquea capturas** y
  oculta la app en el conmutador de tareas.
- Usar **modo kiosco / lock task** (screen pinning) → impide salir a otras apps.

El frontend no cambia; sólo se añade el contenedor nativo. En iOS el bloqueo es
más limitado (Guided Access / Automatic Assessment Configuration vía MDM).

## Despliegue

- **Frontend:** estático (GitHub Pages ya configurado en `.github/workflows`).
- **Backend:** Supabase gestionado. Migración en `supabase/migrations`, función
  en `supabase/functions/exam`. Ver `SETUP.md`.
