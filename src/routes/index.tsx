import { createFileRoute } from "@tanstack/react-router";
import {
  DISCORD_URL,
  CREW_DESCRIPTION,
  PLAYERS,
  FEATURES,
  TOP_SA,
  FAQ,
} from "@/lib/crew-data";

export const Route = createFileRoute("/")({
  component: Index,
});

// Interpola cor de amarelo (topo) até branco (fim) conforme a posição na lista.
function rankColor(index: number, total: number): string {
  const t = total <= 1 ? 0 : index / (total - 1);
  // amarelo dourado -> branco
  const gold = { r: 255, g: 209, b: 74 };
  const white = { r: 255, g: 255, b: 255 };
  const r = Math.round(gold.r + (white.r - gold.r) * t);
  const g = Math.round(gold.g + (white.g - gold.g) * t);
  const b = Math.round(gold.b + (white.b - gold.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function Index() {
  return (
    <div className="min-h-screen font-body">
      {/* Hero */}
      <header className="mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.5em] text-primary/80">Blox Fruits Crew</p>
        <h1 className="float text-glow text-6xl font-black tracking-wider md:text-8xl">
          ZERO ORDER
        </h1>
        <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-foreground/90 md:text-xl">
          {CREW_DESCRIPTION}
        </p>
        <div className="mt-6 inline-block rounded-full border border-border px-4 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          Fundada em 14/07/26
        </div>
      </header>

      {/* Lista + Discord */}
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-3">
        {/* Lista dos melhores — ocupa 2/3 */}
        <div className="glass rounded-2xl p-6 md:col-span-2">
          <h2 className="text-glow mb-6 text-center text-3xl font-bold">Os Melhores da Crew</h2>
          <ol className="grid max-h-[560px] grid-cols-1 gap-1 overflow-y-auto pr-2 sm:grid-cols-2">
            {PLAYERS.map((name, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-lg px-3 py-1.5 transition-colors hover:bg-white/5"
              >
                <span className="w-8 shrink-0 text-right text-sm font-semibold text-primary/70">
                  {i + 1}
                </span>
                <span
                  className="truncate font-semibold"
                  style={{ color: rankColor(i, PLAYERS.length) }}
                >
                  {name}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Discord — ocupa 1/3 */}
        <aside className="glass flex flex-col items-center justify-center rounded-2xl p-8 text-center">
          <div className="float mb-4 text-5xl">💬</div>
          <h2 className="text-glow mb-3 text-2xl font-bold">Entre no Discord</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Avisos, recrutamento e tudo sobre a Zero Order acontecem por lá.
          </p>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105"
          >
            Entrar no Discord
          </a>
        </aside>
      </section>

      {/* O que a crew vai ter */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-glow mb-8 text-center text-4xl font-bold">O Que a Crew Vai Ter</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6">
              <h3 className="mb-3 text-2xl font-bold text-primary">{f.title}</h3>
              <p className="leading-relaxed text-foreground/85">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Placar Top S.A */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-glow mb-8 text-center text-4xl font-bold">Placar — Top S.A</h2>
        <div className="glass overflow-hidden rounded-2xl">
          {TOP_SA.map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-border/50 px-6 py-4 last:border-0"
            >
              <div className="flex items-center gap-4">
                <span className="text-xl font-black text-primary">#{i + 1}</span>
                <span
                  className="text-lg font-semibold"
                  style={{ color: rankColor(i, TOP_SA.length) }}
                >
                  {p.name}
                </span>
              </div>
              <span className="font-bold text-accent">{p.points} pts</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-glow mb-8 text-center text-4xl font-bold">Perguntas Frequentes</h2>
        <div className="space-y-4">
          {FAQ.map((item, i) => (
            <div key={i} className="glass rounded-2xl p-6">
              <h3 className="mb-2 text-xl font-bold text-primary">{item.question}</h3>
              <p className="leading-relaxed text-foreground/85">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-6 py-12 text-center">
        <div className="glass mx-auto max-w-md rounded-2xl p-6">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Criado por</p>
          <p className="text-glow mt-2 text-3xl font-black">ZeroCute</p>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © 2026 Zero Order — Rumo ao topo dos servidores de Blox Fruits.
        </p>
      </footer>
    </div>
  );
}
