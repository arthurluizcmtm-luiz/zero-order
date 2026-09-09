import { useEffect } from "react";

// Dificulta a inspeção casual do site: bloqueia F12, Ctrl/Cmd+Shift+I/J/C,
// Ctrl+U (ver código-fonte), o menu de contexto e tenta detectar DevTools aberto.
export default function SourceGuard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (
        e.key === "F12" ||
        (mod && e.shiftKey && ["i", "j", "c", "k"].includes(k)) ||
        (mod && k === "u") ||
        (mod && k === "s")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onContext = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("contextmenu", onContext);

    // Detecção de DevTools por diferença de tamanho (threshold ampla p/ dock).
    let devtoolsOpen = false;
    const threshold = 170;

    const checkSize = () => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const open = widthDiff > threshold || heightDiff > threshold;
      if (open && !devtoolsOpen) {
        devtoolsOpen = true;
        blankPage();
      } else if (!open) {
        devtoolsOpen = false;
      }
    };

    // Detecção por debugger (tempo de execução salta quando DevTools está aberto).
    const checkDebugger = () => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      if (performance.now() - start > 120) {
        blankPage();
      }
    };

    function blankPage() {
      try {
        document.body.innerHTML = "";
        document.body.style.background = "#050205";
        document.title = "—";
      } catch {
        /* ignore */
      }
    }

    const sizeTimer = window.setInterval(checkSize, 800);
    const dbgTimer = window.setInterval(checkDebugger, 1500);

    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("contextmenu", onContext);
      window.clearInterval(sizeTimer);
      window.clearInterval(dbgTimer);
    };
  }, []);

  return null;
}
