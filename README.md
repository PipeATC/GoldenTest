# Golden Eagle Academy — Plataforma de exámenes

Aplicación web (**PWA**) para **crear y rendir exámenes** con perfiles de
**profesor** y **alumno**, autenticación (incluye **Google**), cursos, módulos,
banco de preguntas y **pruebas seguras** en las que cada alumno recibe un
subconjunto **aleatorio** de preguntas (p.ej. 50 de 200) dentro de un **bloque
horario**.

> Diseño "Academic Prestige": Eagle Navy `#091731` + Golden Yellow `#FBB900`.

## Funcionalidades

### Profesor
- Iniciar sesión con Google o correo.
- Crear **cursos** y matricular alumnos por correo.
- Crear **módulos** (pruebas): duración, nº de preguntas al azar y nota de corte.
- Cargar un **banco de preguntas** (una a una o **importación en lote** JSON/CSV).
- **Asignar** módulos a alumnos con un **bloque horario** (apertura/cierre).
- Ver **resultados** por alumno e **incidencias de seguridad**.

### Alumno
- Ver sus **pruebas asignadas** y rendirlas dentro del bloque horario.
- Examen en **modo seguro** (pantalla completa, detección de salida de app).
- Cada alumno recibe sus **preguntas al azar**; corrección inmediata en el
  servidor y **revisión detallada** con explicaciones.

## Arquitectura (resumen)

- **Frontend:** PWA sin build, módulos ES. Router por hash con guardas de rol.
- **Backend:** [Supabase](https://supabase.com) — Auth (Google/email), PostgreSQL
  con **Row Level Security** y una **Edge Function** que sirve las preguntas al
  azar (sin respuestas) y corrige en el servidor.

Detalle completo en [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Estructura

```
index.html                     Punto de entrada (carga js/app.js como módulo)
css/styles.css                 Sistema de diseño + componentes
js/
  app.js                       Bootstrap + router con guardas de rol
  config.js                    URL y anon key de Supabase
  auth.js                      Sesión, roles, Google/email
  api.js                       Acceso a datos (RLS)
  security.js                  Bloqueo de examen (mejor esfuerzo)
  ui.js  shell.js  render.js   UI compartida, chrome y render
  lib/supabase.js              Cliente Supabase
  views/                       login · student · teacher · settings
supabase/
  migrations/0001_init.sql     Esquema + RLS + triggers
  functions/exam/index.ts      Edge Function (aleatorio + corrección)
sw.js  manifest.webmanifest    PWA (offline / instalable)
```

## Puesta en marcha

Sigue [`SETUP.md`](SETUP.md): crear el proyecto Supabase, ejecutar la migración,
activar Google, desplegar la función y pegar tu URL/anon key en `js/config.js`.

Desarrollo local (un service worker necesita HTTP):

```bash
python3 -m http.server 8080   # abre http://localhost:8080
```

## Seguridad del examen — nota importante

El bloqueo de capturas y de cambio de app es **de mejor esfuerzo**: una web no
puede impedirlos al 100%. Las incidencias se **registran** para el profesor.
El plan de seguridad completo —pensado para pruebas **supervisadas en sala** con
dispositivos propios (PC/Android/iOS)— está en [`SECURITY.md`](SECURITY.md).
