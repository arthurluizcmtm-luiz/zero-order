import { useEffect, useMemo, useRef, useState } from "react";
import { youtubeId } from "@/lib/discord";
import musicAsset from "@/assets/music.mp3.asset.json";

type Kind = "audio" | "youtube" | "spotify" | "none";

function spotifyEmbed(url: string): string | null {
  const m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|playlist|album|episode)\/([A-Za-z0-9]+)/);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator` : null;
}

// Toca música a partir da célula M1 da planilha.
// Suporta: link direto (mp3/ogg/wav/m4a), YouTube (toca inteira) e Spotify (embed).
export default function MusicPlayer({ url }: { url: string }) {
  const src = (url ?? "").trim();

  const kind: Kind = useMemo(() => {
    if (!src) return "none";
    if (/open\.spotify\.com/.test(src)) return "spotify";
    if (youtubeId(src)) return "youtube";
    return "audio";
  }, [src]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytRef = useRef<HTMLIFrameElement | null>(null);
  const [open, setOpen] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(60);
  const lastVolRef = useRef(60);

  const ytCommand = (func: string, args: unknown[] = []) => {
    ytRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*",
    );
  };

  // Volume / mute
  useEffect(() => {
    if (kind === "audio") {
      const a = audioRef.current;
      if (!a) return;
      a.volume = (muted ? 0 : volume) / 100;
      a.muted = muted;
    } else if (kind === "youtube") {
      ytCommand("setVolume", [muted ? 0 : volume]);
      ytCommand(muted ? "mute" : "unMute");
    }
  }, [volume, muted, kind, src]);

  if (kind === "none") return null;

  const toggle = async () => {
    if (kind === "audio") {
      const a = audioRef.current;
      if (!a) return;
      if (a.paused) {
        try { await a.play(); setPlaying(true); } catch {}
      } else { a.pause(); setPlaying(false); }
      return;
    }
    if (kind === "youtube") {
      ytCommand(playing ? "pauseVideo" : "playVideo");
      setPlaying((v) => !v);
    }
  };

  const ytId = kind === "youtube" ? youtubeId(src) : null;
  const spUrl = kind === "spotify" ? spotifyEmbed(src) : null;

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

        {kind === "audio" && <audio ref={audioRef} src={src} preload="auto" loop />}

        {kind === "youtube" && ytId && (
          <iframe
            ref={ytRef}
            title="Zero Order Radio"
            className="h-0 w-0 border-0"
            src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=1&loop=1&playlist=${ytId}&controls=0`}
            allow="autoplay; encrypted-media"
          />
        )}

        {open && kind === "spotify" && spUrl && (
          <div className="overflow-hidden rounded-xl">
            <iframe
              title="Spotify"
              src={spUrl}
              className="h-[152px] w-full border-0"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
              loading="lazy"
            />
            <p className="mt-1 text-[10px] leading-tight text-white/50">
              Spotify só toca a faixa inteira se você estiver logado no Spotify neste navegador.
              Para tocar 100% para todo mundo, use um link do YouTube ou .mp3 na M1.
            </p>
          </div>
        )}

        {open && kind !== "spotify" && (
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:scale-105"
              aria-label={playing ? "Pausar" : "Tocar"}
            >
              {playing ? "⏸" : "▶"}
            </button>
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
        )}
      </div>
    </div>
  );
}
