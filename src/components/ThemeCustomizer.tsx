import { useEffect, useState } from "react";

type Theme = {
  primary: string;
  secondary: string;
  tertiary: string;
  background: string;
  gradient: boolean;
};

const DEFAULT_THEME: Theme = {
  primary: "#ff2a3d",
  secondary: "#ffffff",
  tertiary: "#b30015",
  background: "#1a0508",
  gradient: true,
};

const STORAGE_KEY = "zero-order-theme";

const PRESETS: { name: string; theme: Theme }[] = [
  { name: "Vermelho/Branco", theme: DEFAULT_THEME },
  { name: "Ouro/Preto", theme: { primary: "#ffd700", secondary: "#ffffff", tertiary: "#8b6b00", background: "#0d0a00", gradient: true } },
  { name: "Neon Roxo", theme: { primary: "#a855f7", secondary: "#f0abfc", tertiary: "#4c1d95", background: "#0f0518", gradient: true } },
  { name: "Oceano", theme: { primary: "#06b6d4", secondary: "#ffffff", tertiary: "#0e7490", background: "#031720", gradient: true } },
  { name: "Verde Mata", theme: { primary: "#22c55e", secondary: "#ecfccb", tertiary: "#166534", background: "#04140a", gradient: true } },
  { name: "Rosa Cyber", theme: { primary: "#ec4899", secondary: "#ffffff", tertiary: "#831843", background: "#160510", gradient: true } },
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.style.setProperty("--theme-primary", t.primary);
  root.style.setProperty("--theme-secondary", t.secondary);
  root.style.setProperty("--theme-tertiary", t.tertiary);
  root.style.setProperty("--theme-background", t.background);
  const [pr, pg, pb] = hexToRgb(t.primary);
  root.style.setProperty("--theme-primary-rgb", `${pr}, ${pg}, ${pb}`);
  root.style.setProperty(
    "--theme-gradient",
    t.gradient
      ? `linear-gradient(120deg, ${t.primary}, ${t.secondary}, ${t.tertiary}, ${t.secondary}, ${t.primary})`
      : t.primary,
  );
}

export function loadStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    return { ...DEFAULT_THEME, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_THEME;
  }
}

export default function ThemeCustomizer() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = loadStoredTheme();
    setTheme(t);
    applyTheme(t);
  }, []);

  const update = (patch: Partial<Theme>) => {
    const next = { ...theme, ...patch };
    setTheme(next);
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const reset = () => {
    setTheme(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 w-72 rounded-2xl border border-white/15 bg-black/85 p-4 text-white shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest">🎨 Tema</h3>
            <button onClick={reset} className="text-xs text-white/60 hover:text-white">Resetar</button>
          </div>

          <div className="mb-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-white/60">Presets</p>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => update(p.theme)}
                  className="rounded-md border border-white/10 p-1.5 text-[10px] hover:border-white/40"
                  style={{
                    background: `linear-gradient(120deg, ${p.theme.primary}, ${p.theme.secondary}, ${p.theme.tertiary})`,
                    color: "#000",
                  }}
                  title={p.name}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {([
            ["primary", "Primária"],
            ["secondary", "Secundária"],
            ["tertiary", "Terciária"],
            ["background", "Fundo"],
          ] as const).map(([k, label]) => (
            <label key={k} className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="text-white/80">{label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme[k]}
                  onChange={(e) => update({ [k]: e.target.value } as Partial<Theme>)}
                  className="h-7 w-10 cursor-pointer rounded border border-white/20 bg-transparent"
                />
                <input
                  type="text"
                  value={theme[k]}
                  onChange={(e) => update({ [k]: e.target.value } as Partial<Theme>)}
                  className="w-20 rounded border border-white/20 bg-black/40 px-1.5 py-1 font-mono text-[10px]"
                />
              </div>
            </label>
          ))}

          <label className="mt-2 flex items-center justify-between text-xs">
            <span className="text-white/80">Gradiente animado</span>
            <input
              type="checkbox"
              checked={theme.gradient}
              onChange={(e) => update({ gradient: e.target.checked })}
              className="h-4 w-4 accent-red-500"
            />
          </label>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-white/20 bg-black/80 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-xl backdrop-blur hover:bg-black"
      >
        🎨 {open ? "Fechar" : "Tema"}
      </button>
    </div>
  );
}
