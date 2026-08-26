# Plan de seguridad del examen

Documento de decisión sobre cómo se controla el entorno durante una prueba en
Golden Eagle Academy.

## Modelo de amenaza (nuestro escenario real)

| Condición | Consecuencia para el diseño |
| --- | --- |
| Los alumnos usan **su propio dispositivo** (PC, Android o iOS) | Necesitamos **una sola solución multiplataforma**, sin instalar software distinto por sistema. |
| Rinden en una **sala con un profesor vigilando** | Un humano cubre lo que el software no puede (mirar otra pantalla, un segundo teléfono, hablar). |
| Las **fotos externas no son un problema** | No dependemos de bloquear capturas de pantalla (algo que la web no puede garantizar de todos modos). |

**Objetivo:** impedir las **fugas digitales** durante la prueba —abrir otra app o
pestaña, buscar en internet, copiar/pegar, salir del examen— y **registrar** toda
incidencia para que el profesor actúe en el momento.

## Estrategia elegida: bloqueo web reforzado + supervisión humana

Es la **única** capa que corre idéntica en PC + Android + iOS sin fragmentar el
producto, y encaja con que haya un profesor presente.

Descartamos las alternativas de bloqueo "duro" porque **no cubren los tres
sistemas con una sola base**:

- **Safe Exam Browser** (bloqueo real a nivel de SO): Windows, macOS e iPad, pero
  **no tiene Android**.
- **App nativa Android** (`FLAG_SECURE` + kiosco): fuerte en Android, pero deja
  fuera a iOS y a los PC.
- **MDM / dispositivos gestionados**: requiere que la institución sea dueña de los
  equipos; aquí son de los alumnos.

> Estas opciones quedan documentadas como **posibles mejoras futuras** si el
> escenario cambia (ver el final). No son necesarias para una sala vigilada.

## Qué puede y qué no puede hacer un navegador (por plataforma)

| Control | PC (Chrome/Edge/Firefox/Safari) | Android (Chrome) | iOS (Safari) |
| --- | --- | --- | --- |
| Detectar cambio de app/pestaña (`visibilitychange`, `blur`) | ✅ | ✅ | ✅ |
| Forzar **pantalla completa** | ✅ | ✅ | ⚠️ **iPhone no** soporta la API; iPad limitado |
| Ocultar la barra del navegador | ✅ (pantalla completa) | ✅ | ✅ **solo como PWA instalada** (a pantalla de inicio) |
| Bloquear menú contextual / selección / copiar-pegar | ✅ | ✅ | ✅ |
| Bloquear atajos (PrintScreen, F12, Ctrl+…) | ✅ | n/a | n/a |
| **Impedir** una captura de pantalla del sistema | ❌ | ❌ | ❌ |
| **Impedir** salir de la app (a la fuerza) | ❌ | ❌ | ❌ |

**Conclusiones clave:**
- Ningún navegador *impide* salir ni capturar; sí puede **detectarlo al instante**.
  En una sala vigilada, esa detección + el profesor = control efectivo.
- En **iPhone** la pantalla completa no existe: la prueba debe correr como **PWA
  instalada** (Añadir a pantalla de inicio) para ocultar la interfaz de Safari.
  Esto se exigirá antes de comenzar.

## Lo que YA está implementado

Durante la prueba, mientras el intento está activo (`js/security.js` +
`js/views/student.js`):

- ✅ **Chequeo previo del dispositivo.** Antes de comenzar, en **iOS** se exige que
  la prueba corra como **PWA instalada** (`display-mode: standalone`); si no, se
  bloquea el inicio con instrucciones para "Añadir a pantalla de inicio".
- ✅ **Pantalla completa** obligatoria al comenzar (donde la plataforma lo permite).
- ✅ **Detección de salida** (`visibilitychange`, `blur`, salir de pantalla completa).
- ✅ **Bloqueo con código del profesor.** Ante una salida, si el módulo usa la acción
  `lock`, el examen se **congela** con una cortina a pantalla completa; para reanudar,
  el **profesor** ingresa su código, que se **valida en el servidor** (Edge Function
  `exam` → `resume`) y **nunca se envía al cliente**. El cronómetro se **pausa**
  mientras está congelado y se reanuda al continuar.
- ✅ **Configuración por módulo.** El profesor elige la acción ante salida
  (`flag` solo registrar · `lock` congelar con código · `submit` autoentregar tras
  N salidas), el código y el máximo de salidas.
- ✅ **Anulación de gestos y menús móviles.** `-webkit-touch-callout`, `user-select`
  y `overscroll-behavior` desactivados durante la prueba (los campos de respuesta
  siguen siendo interactivos).
- ✅ **Guardas de navegación.** `beforeunload` (recargar/cerrar) y fijado del
  historial (retroceder), con registro de incidencia.
- ✅ **Bloqueo** de menú contextual, selección de texto y portapapeles
  (copiar/cortar/pegar/arrastrar) y de **atajos** sensibles (PrintScreen, F12,
  Ctrl/Cmd+P/C/S/U…), con vaciado del portapapeles ante PrintScreen.
- ✅ **Registro de incidencias** en `attempts.security_events`, visible para el
  profesor en la tabla de resultados (columna "Incidencias").

### Cómo se valida el código del profesor (sin exponerlo)

El `proctor_code` vive en la tabla `modules` y **nunca** se envía al navegador del
alumno (la Edge Function `start` lo omite). Cuando el examen se congela, la app
llama a `exam → resume` con el código tecleado; el servidor lo compara y responde
solo `{ ok: true|false }`, registrando el evento (`resumed_by_proctor` o
`resume_denied`). Así el alumno no puede leer ni deducir el código.

## Mejoras posibles (siguiente iteración)

- **Monitor en vivo para el profesor**: panel que muestre las incidencias de los
  alumnos a medida que ocurren, para intervenir en la sala en tiempo real.

## Flujo del examen supervisado (cómo se usa en la sala)

1. El profesor activa la prueba con su **bloque horario**.
2. El alumno abre la app (en iOS, la **PWA instalada**) y pasa el **chequeo previo**.
3. El examen entra en **modo seguro** (pantalla completa, bloqueos activos).
4. Cualquier salida **congela** el examen y avisa; el profesor se acerca y, si
   corresponde, lo **reanuda con su código**.
5. Al entregar, la corrección ocurre en el servidor y las **incidencias** quedan
   en el registro del intento para revisión posterior.

## Qué NO intentamos (y por qué está bien)

- **Bloquear capturas de pantalla**: la web no puede en ningún sistema, y en tu
  escenario las fotos no son el problema (hay vigilancia presencial).
- **Impedir por software que el alumno salga del dispositivo**: imposible en
  equipos no gestionados; lo cubre el profesor en la sala.

## Mejoras futuras si el escenario cambia

Si algún día se rinde **sin vigilancia** o se quiere blindaje a nivel de SO:

- **PC/iPad:** integrar **Safe Exam Browser** (config `.seb` + verificación de
  *config key*) para que la prueba solo se abra desde el navegador bloqueado.
- **Android:** empaquetar la PWA con **Capacitor** y activar `FLAG_SECURE`
  (bloquea capturas) + **modo kiosco**.
- **Institucional:** **MDM** sobre dispositivos del colegio para kiosco real.

Estas se pueden añadir **sin rehacer el frontend**: son capas por encima de la
misma app web.
