import { shell } from "./shell.js";
import { $, $$ } from "./ui.js";
import { signOut } from "./auth.js";

const rootEl = () => document.getElementById("root");

// Renderiza una vista dentro del shell (sidebar + topbar) y enlaza el chrome.
export function render(active, title, html) {
  rootEl().innerHTML = shell(active, title, html);
  bindShell();
  window.scrollTo(0, 0);
}

// Renderiza contenido a pantalla completa sin shell (login, examen en curso).
export function renderRaw(html) { rootEl().innerHTML = html; }

function bindShell() {
  const ham = $("#hamburger"), scrim = $("#scrim");
  if (ham) ham.onclick = () => document.body.classList.toggle("nav-open");
  if (scrim) scrim.onclick = () => document.body.classList.remove("nav-open");
  $$(".nav a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("nav-open")));
  const lo = $("#logoutBtn"); if (lo) lo.onclick = () => signOut();
}
