// Bloqueo de examen "de mejor esfuerzo" para la web (multiplataforma).
//
// ⚠️ Un navegador NO puede impedir de verdad una captura de pantalla ni una
// foto con otro dispositivo. En una sala vigilada eso lo cubre el profesor.
// Aquí DETECTAMOS y REGISTRAMOS fugas digitales y endurecemos el entorno:
//   - pantalla completa obligatoria (salir queda registrado y dispara incidencia)
//   - detección de cambio de pestaña/app (visibilitychange, blur)
//   - bloqueo de menú contextual, selección, copiar/pegar y gestos móviles
//   - bloqueo de atajos comunes (PrintScreen, F12, Ctrl+P/C/S/U…)
//   - guarda de navegación (recargar / cerrar / retroceder)
//
// La POLÍTICA ante una incidencia (marcar / congelar con código del profesor /
// autoentregar) la decide el runner mediante el callback `onIncident`.

export function createExamGuard({ onEvent, onIncident } = {}) {
  const events = [];
  let incidents = 0;
  let active = false;
  const handlers = [];

  const record = (type, detail) => {
    const ev = { type, detail: detail || null, at: new Date().toISOString() };
    events.push(ev);
    onEvent && onEvent(ev, events);
    return ev;
  };

  // Eventos que cuentan como "salida" del examen.
  const incident = (type, detail) => {
    if (!active) return;
    incidents++;
    const ev = record(type, detail);
    onIncident && onIncident(ev, incidents);
  };

  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    handlers.push(() => target.removeEventListener(type, fn, opts));
  };

  const block = (e) => { e.preventDefault(); e.stopPropagation(); return false; };

  async function enterFullscreen() {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch { /* iPhone no soporta la API; el usuario puede rechazarla */ }
  }

  function start() {
    if (active) return; active = true;
    enterFullscreen();

    // Salida de la app / cambio de pestaña.
    on(document, "visibilitychange", () => { if (document.hidden) incident("blur", { reason: "visibility_hidden" }); });
    on(window, "blur", () => incident("window_blur"));

    // Salir de pantalla completa durante el examen.
    on(document, "fullscreenchange", () => { if (!document.fullscreenElement && active) incident("fullscreen_exit"); });

    // Recargar / cerrar la pestaña.
    on(window, "beforeunload", (e) => {
      record("unload_attempt");
      e.preventDefault();
      e.returnValue = "";
      return "";
    });

    // Retroceso del historial.
    try { history.pushState(null, "", location.href); } catch {}
    on(window, "popstate", () => {
      record("back_blocked");
      try { history.pushState(null, "", location.href); } catch {}
    });

    // Menú contextual, selección y portapapeles.
    ["contextmenu", "selectstart", "copy", "cut", "paste", "dragstart"].forEach((t) =>
      on(document, t, block, { capture: true }));

    // Atajos de teclado sensibles (best effort).
    on(document, "keydown", (e) => {
      const k = (e.key || "").toLowerCase();
      const combo = e.ctrlKey || e.metaKey;
      if (
        e.key === "PrintScreen" ||
        (combo && ["p", "c", "s", "u", "x"].includes(k)) ||
        (combo && e.shiftKey && ["i", "j", "c"].includes(k)) ||
        e.key === "F12"
      ) {
        record("shortcut_blocked", { key: e.key });
        try { navigator.clipboard && navigator.clipboard.writeText(""); } catch {}
        return block(e);
      }
    }, { capture: true });

    document.body.classList.add("exam-locked");
    record("exam_started");
  }

  function stop() {
    if (!active) return; active = false;
    handlers.splice(0).forEach((off) => off());
    document.body.classList.remove("exam-locked");
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch {}
  }

  return {
    start, stop,
    reenterFullscreen: enterFullscreen,
    getEvents: () => events.slice(),
    get incidents() { return incidents; },
  };
}

/* ----------------------------- Chequeo previo ----------------------------- */
export const isIOS = () =>
  /iP(hone|ad|od)/.test(navigator.platform) ||
  (/Mac/.test(navigator.platform) && navigator.maxTouchPoints > 1) ||
  /iPhone|iPad|iPod/.test(navigator.userAgent);

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

// Devuelve null si todo OK, o un objeto { title, detail } con el bloqueo.
export function preflightCheck() {
  // En iOS la pantalla completa no existe: exigimos PWA instalada para ocultar
  // la interfaz de Safari.
  if (isIOS() && !isStandalone()) {
    return {
      title: "Instala la app antes de rendir",
      detail: "En iPhone/iPad debes abrir la prueba desde la app instalada. En Safari, pulsa Compartir → “Añadir a pantalla de inicio”, y abre la app desde ahí.",
    };
  }
  return null;
}
