# Golden Eagle Academy — Portal de Exámenes (PWA)

Aplicación web **instalable (PWA)** para rendir exámenes de inglés en la academia
**Golden Eagle**. Construida a partir del diseño *Academic Prestige* de Stitch:
paleta **Eagle Navy** `#091731` + **Golden Yellow** `#FBB900`, tipografías
Comfortaa / Source Sans 3 / Roboto Flex, y un sistema de tarjetas con bordes
suaves y esquinas redondeadas.

## Características

- **Instalable / offline**: `manifest.webmanifest` + service worker (`sw.js`) con
  precache del app-shell, `stale-while-revalidate` para las fuentes y página
  `offline.html` de respaldo.
- **SPA sin dependencias**: enrutado por hash, sin frameworks ni CDN de runtime
  (solo Google Fonts, cacheadas por el SW). Todo funciona sin conexión.
- **4 pantallas del diseño**, más navegación completa:
  1. **Dashboard** — saludo, tarjetas de nivel/horas/promedio, próximos
     exámenes, actividad reciente, área de enfoque y consejo de estudio.
  2. **Exam Library (My Exams)** — exámenes por nivel CEFR, filtros y tarjetas
     con destrezas y duración.
  3. **Examen en progreso** — pasaje de lectura con huecos, tarjeta de pregunta,
     **temporizador**, **navegador de preguntas**, marcar para revisión,
     autoguardado y reanudación.
  4. **Resultados** — nota global, feedback del instructor, desglose por
     destreza y revisión detallada pregunta por pregunta con explicaciones.

## Estructura

```
index.html                 Punto de entrada (SPA)
offline.html               Fallback sin conexión
manifest.webmanifest       Metadatos de instalación
sw.js                      Service worker (cache/offline)
css/styles.css             Sistema de diseño Academic Prestige
js/data.js                 Datos de exámenes y perfil (demo)
js/app.js                  Router, motor de examen, resultados y PWA
icons/                     Iconos de la app (navy + águila dorada)
assets/                    Logo del águila
```

## Uso local

Un service worker requiere HTTP(S) (no `file://`). Sirve la carpeta con
cualquier servidor estático, por ejemplo:

```bash
python3 -m http.server 8080
# luego abre http://localhost:8080
```

Para instalar: en Chrome/Edge aparece el icono *Instalar* en la barra de
direcciones (o menú → “Instalar app”); en iOS Safari, Compartir → “Agregar a
pantalla de inicio”.

## Notas

Los datos de exámenes, respuestas e intentos se guardan en `localStorage` del
navegador (demo). En una versión de producción se conectarían a una API.
