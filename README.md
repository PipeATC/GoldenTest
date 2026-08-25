# Golden Eagle Academy — Aviation English (ICAO) PWA

An **installable (PWA)** web app for **Aviation English** training and testing at
**Golden Eagle Academy**, aligned to the **ICAO Language Proficiency Rating
Scale** (Levels 1–6). Built from the Stitch *"Academic Prestige"* design:
**Eagle Navy** `#091731` + **Golden Yellow** `#FBB900`, Comfortaa / Source Sans 3
/ Roboto Flex typography, and a soft-bordered, rounded card system. The entire
interface is in English.

## Modules

The programme is organised into three modules mapped onto the ICAO levels:

| Module | Focus | ICAO level |
| --- | --- | --- |
| **Aviation 101** | Radiotelephony foundations: phonetic alphabet, number pronunciation, standard phraseology, read-back | Level 3 → 4 |
| **Aviation 102** | Operational communications: clearances, position reports, altimeter setting (QNH), aerodrome weather (METAR) | Level 4 (Operational) |
| **Aviation 103** | Non-routine & emergencies: MAYDAY vs PAN-PAN, plain language, negotiating misunderstandings | Level 5 → 6 |

Results are rated against the **six ICAO language descriptors**: Pronunciation,
Structure, Vocabulary, Fluency, Comprehension and Interactions. The pass
threshold is **Operational Level 4** — the minimum required to operate
internationally.

## Features

- **Installable / offline**: `manifest.webmanifest` + service worker (`sw.js`)
  with app-shell precache, `stale-while-revalidate` for fonts, and an
  `offline.html` fallback.
- **Vanilla SPA**: hash routing, no runtime framework or CDN (only Google Fonts,
  cached by the SW).
- **Screens**:
  1. **Dashboard** — welcome banner, ICAO level / study hours / average score,
     upcoming modules, recent activity, focus area and study tip.
  2. **My Modules (Exam Library)** — modules grouped by ICAO level, with filters,
     descriptors and duration.
  3. **Module Runner** — radiotelephony reading passage with gap-fill,
     multiple-choice questions, **countdown timer**, **question navigator**,
     flag-for-review, autosave and resume.
  4. **Results** — overall score with **ICAO level verdict**, AI instructor
     feedback, ICAO descriptor breakdown and a question-by-question review with
     explanations.
- Fully responsive with a mobile drawer navigation.

## Structure

```
index.html                 SPA entry point
offline.html               Offline fallback
manifest.webmanifest       Install metadata
sw.js                      Service worker (cache/offline)
css/styles.css             Academic Prestige design system
js/data.js                 Modules, questions and student profile (demo)
js/app.js                  Router, module runner, results and PWA logic
icons/                     App icons (navy + golden eagle)
assets/                    Eagle logo
```

## Running locally

A service worker needs HTTP(S) (not `file://`). Serve the folder with any static
server, e.g.:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

To install: in Chrome/Edge use the *Install* icon in the address bar (or menu →
"Install app"); on iOS Safari, Share → "Add to Home Screen".

## Notes

Module content, answers and attempts are stored in the browser's `localStorage`
(demo). In production these would be served from an API. The ICAO level verdict
and descriptor breakdown are illustrative mappings derived from the overall
score for demonstration purposes.
