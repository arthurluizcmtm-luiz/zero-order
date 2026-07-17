import { useEffect, useRef, useState } from "react";

// Extrai o tipo (track/playlist/album/episode) e id de uma URL/URI do Spotify.
function parseSpotify(url: string): { type: string; id: string } | null {
  const s = url.trim();
  if (!s) return null;
  const m1 = s.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|playlist|album|episode|show)\/([A-Za-z0-9]+)/);
  if (m1) return { type: m1[1], id: m1[2] };
  const m2 = s.match(/^spotify:(track|playlist|album|episode|show):([A-Za-z0-9]+)$/);
  if (m2) return { type: m2[1], id: m2[2] };
  return null;
}

// Carrega o Spotify IFrame API uma única vez.
function loadSpotifyApi(): Promise<any> {
  return new Promise((resolve) => {
    const w = window as any;
    if (w.SpotifyIframeApi) return resolve(w.SpotifyIframeApi);
    w.onSpotifyIframeApiReady = (api: any) => {
      w.SpotifyIframeApi = api;
      resolve(api);
    };
    if (!document.getElementById("spotify-iframe-api")) {
      const s = document.createElement("script");
      s.id = "spotify-iframe-api";
      s.src = "https://open.spotify.com/embed/iframe-api/v1";
      s.async = true;
      document.body.appendChild(s);
    }
  });
}

export default function MusicPlayer({ url }: { url: string }) {
  const info = parseSpotify(url);
  const holderRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<any>(null);
  const [open, setOpen] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(60);
  const lastVolRef = useRef(60);

  useEffect(() => {
    if (!info || !holderRef.current) return;
    let disposed = false;
    loadSpotifyApi().then((api) => {
      if (disposed || !holderRef.current) return;
      // Reset holder
      holderRef.current.innerHTML = "";
      const target = document.createElement("div");
      holderRef.current.appendChild(target);
      api.createController(
        target,
        {
          uri: `spotify:${info.type}:${info.id}`,
          width: "100%",
          height: 152,
        },
        (ctrl: any) => {
          controllerRef.current = ctrl;
          try { ctrl.setVolume(volume / 100); } catch {}
        },
      );
    });
    return () => {
      disposed = true;
      try { controllerRef.current?.destroy?.(); } catch {}
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info?.type, info?.id]);

  useEffect(() => {
    const c = controllerRef.current;
    if (!c) return;
    try { c.setVolume(muted ? 0 : volume / 100); } catch {}
  }, [volume, muted]);

  if (!info) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 w-[320px] max-w-[calc(100vw-2rem)]">
      <div className="glass rounded-2xl p-3 shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="pulse-glow inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="gradient-shift text-xs font-black uppercase tracking-widest">
              ♫ Zero Order Radio
            </span>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/80 hover:bg-white/20"
            aria-label={open ? "Minimizar" : "Abrir"}
          >
            {open ? "—" : "▲"}
          </button>
        </div>

        {open && (
          <>
            <div ref={holderRef} className="overflow-hidden rounded-xl" />
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  if (muted) {
                    setMuted(false);
                    if (volume === 0) setVolume(lastVolRef.current || 60);
                  } else {
                    lastVolRef.current = volume;
                    setMuted(true);
                  }
                }}
                className="shrink-0 rounded-full bg-primary/80 px-3 py-1 text-xs font-bold text-primary-foreground hover:bg-primary"
                aria-label={muted ? "Ativar som" : "Silenciar"}
              >
                {muted || volume === 0 ? "🔇" : volume < 40 ? "🔈" : volume < 75 ? "🔉" : "🔊"}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  if (v > 0 && muted) setMuted(false);
                }}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-[var(--theme-primary)]"
                aria-label="Volume"
              />
              <span className="w-8 shrink-0 text-right text-[10px] font-mono text-white/70">
                {muted ? 0 : volume}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
