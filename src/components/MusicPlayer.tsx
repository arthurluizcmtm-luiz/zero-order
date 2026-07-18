import { useEffect, useRef, useState } from "react";

// Toca o áudio diretamente a partir de uma URL (mp3/ogg/wav/m4a etc).
// Não é embed do Spotify — a música toca inteira com controles de volume/mute.
export default function MusicPlayer({ url }: { url: string }) {
  const src = (url ?? "").trim();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [open, setOpen] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(60);
  const lastVolRef = useRef(60);

  // Aplica volume/mute no <audio>.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = (muted ? 0 : volume) / 100;
    a.muted = muted;
  }, [volume, muted, src]);

  // Tenta autoplay ao carregar (silencia caso o navegador bloqueie).
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !src) return;
    a.loop = true;
    const tryPlay = async () => {
      try {
        await a.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    };
    tryPlay();
  }, [src]);

  if (!src) return null;

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try { await a.play(); setPlaying(true); } catch {}
    } else {
      a.pause();
      setPlaying(false);
    }
  };

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

        <audio ref={audioRef} src={src} preload="auto" loop crossOrigin="anonymous" />

        {open && (
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
