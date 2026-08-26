// Bloqueo de examen "de mejor esfuerzo" para la web.
//
// ⚠️ Un navegador NO puede impedir de verdad una captura de pantalla ni una
// foto con otro dispositivo. Esto disuade y REGISTRA incidencias:
//   - pantalla completa obligatoria (salir queda registrado)
//   - detección de cambio de pestaña/app (visibilitychange, blur)
//   - bloqueo de menú contextual, selección, copiar/pegar
//   - bloqueo de atajos comunes (PrintScreen, F12, Ctrl+P/C/S/U…)
// Cada incidencia se reporta al callback para poder avisar o autoentregar.

export function createExamGuard({ onEvent, onLeave, maxLeaves = 3 } = {}) {
  const events = [];
  let leaves = 0;
  let active = false;
  const handlers = [];

  const record = (type, detail) => {
    const ev = { type, detail: detail || null, at: new Date().toISOString() };
    events.push(ev);
    onEvent && onEvent(ev, events);
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
    } catch { /* el usuario puede rechazarlo */ }
  }

  function start() {
    if (active) return; active = true;
    enterFullscreen();

    // Salida de la app / cambio de pestaña.
    on(document, "visibilitychange", () => {
      if (document.hidden) {
        leaves++; record("blur", { reason: "visibility_hidden", count: leaves });
        onLeave && onLeave(leaves, maxLeaves);
      }
    });
    on(window, "blur", () => { record("window_blur"); });

    // Salir de pantalla completa durante el examen.
    on(document, "fullscreenchange", () => {
      if (!document.fullscreenElement && active) {
        record("fullscreen_exit");
        onLeave && onLeave(leaves, maxLeaves);
      }
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
        (combo && ["p", "c", "s", "u", "x"].includes(k)) ||        // imprimir/copiar/guardar/fuente
        (combo && e.shiftKey && ["i", "j", "c"].includes(k)) ||    // devtools
        e.key === "F12"
      ) {
        record("shortcut_blocked", { key: e.key });
        // Vacía el portapapeles como medida extra ante PrintScreen.
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

  return { start, stop, getEvents: () => events.slice(), get leaves() { return leaves; } };
}
