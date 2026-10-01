import { useEffect } from "react";

// Dificulta a inspeção casual sem interferir na troca de aba ou no uso normal.
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

    // Só reage a uma diferença grande e persistente enquanto a página está
    // visível e focada. Isso evita o falso positivo ao trocar de aba.
    let suspiciousChecks = 0;
    const threshold = 260;

    const checkSize = () => {
      if (document.visibilityState !== "visible" || !document.hasFocus()) {
        suspiciousChecks = 0;
        return;
      }
      const widthDiff = Math.max(0, window.outerWidth - window.innerWidth);
      const heightDiff = Math.max(0, window.outerHeight - window.innerHeight);
      const suspicious = widthDiff > threshold || heightDiff > threshold;
      suspiciousChecks = suspicious ? suspiciousChecks + 1 : 0;
      if (suspiciousChecks >= 3) blankPage();
    };

    function blankPage() {
      try {
        document.body.innerHTML = "";
        document.body.style.background = "var(--background)";
        document.title = "—";
      } catch {
        /* ignore */
      }
    }

    const sizeTimer = window.setInterval(checkSize, 900);

    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("contextmenu", onContext);
      window.clearInterval(sizeTimer);
    };
  }, []);

  return null;
}
