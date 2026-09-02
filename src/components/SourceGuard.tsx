import { useEffect } from "react";

// Dificulta a inspeção casual do site: bloqueia F12, Ctrl/Cmd+Shift+I/J/C,
// Ctrl+U (ver código-fonte) e o menu de contexto.
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
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("contextmenu", onContext);
    };
  }, []);

  return null;
}
