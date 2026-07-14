import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  DISCORD_URL,
  SITE_URL,
  CREW_DESCRIPTION,
  FEATURES,
  FAQ,
} from "@/lib/crew-data";
import { fetchSheetData } from "@/lib/sheet.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

// Interpola cor de vermelho intenso → branco conforme a posição.
function rankColor(index: number, total: number): string {
  const t = total <= 1 ? 0 : index / (total - 1);
  const red = { r: 255, g: 42, b: 61 };
  const white = { r: 255, g: 255, b: 255 };
  const r = Math.round(red.r + (white.r - red.r) * t);
  const g = Math.round(red.g + (white.g - red.g) * t);
  const b = Math.round(red.b + (white.b - red.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

type RankListProps = {
  title: string;
  items: string[];
  emoji: string;
  emptyMsg: string;
  isLoading: boolean;
  error?: string;
};

function RankList({ title, items, emoji, emptyMsg, isLoading, error }: RankListProps) {
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="mb-4 flex items-center justify-center gap-2 text-center text-2xl font-bold">
        <span>{emoji}</span>
        <span className="gradient-shift">{title}</span>
      </h3>
      {error ? (
        <p className="text-center text-xs text-muted-foreground">—</p>
      ) : isLoading ? (
        <p className="text-center text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{emptyMsg}</p>
      ) : (
        <ol className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {items.map((name, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-white/5"
            >
              <span className="w-7 shrink-0 text-right text-xs font-semibold text-primary/80">
                {i + 1}
              </span>
              <span
                className="truncate font-semibold"
                style={{ color: rankColor(i, Math.max(items.length, 2)) }}
              >
                {name}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Index() {
  const fetchSheet = useServerFn(fetchSheetData);
  const { data, isLoading } = useQuery({
    queryKey: ["sheet"],
    queryFn: () => fetchSheet(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const crew = data?.crew ?? [];
  const topSA = data?.topSA ?? [];
  const skilled = data?.skilled ?? [];
  const mobile = data?.mobile ?? [];
  const pc = data?.pc ?? [];
  const consolePlayers = data?.console ?? [];
  const sheetError = data?.error;
  const discordUrl = data?.discordUrl?.trim() || DISCORD_URL;

  return (
    <div className="min-h-screen font-body">
      {/* Hero */}
      <header className="mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.5em] text-primary/80">
          Blox Fruits Crew
        </p>
        <h1 className="float text-6xl font-black tracking-wider md:text-8xl">
          <span className="gradient-shift">ZERO ORDER</span>
        </h1>
        <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-foreground/90 md:text-xl">
          {CREW_DESCRIPTION}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <div className="rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs uppercase tracking-widest text-primary-foreground/90">
            Fundada em 14/07/26
          </div>
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pulse-glow rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
          >
            💬 Entrar no Discord
          </a>
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm font-bold text-white backdrop-blur transition-transform hover:scale-105"
          >
            🔗 Link do site
          </a>
        </div>
      </header>

      {/* Aviso da planilha */}
      {sheetError && (
        <section className="mx-auto max-w-6xl px-6">
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200/90">
            {sheetError}
          </div>
        </section>
      )}

      {/* Melhores da Crew + Discord */}
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-3">
        <div className="glass rounded-2xl p-6 md:col-span-2">
          <h2 className="mb-6 text-center text-3xl font-bold">
            <span className="gradient-shift">Os Melhores da Crew</span>
          </h2>

          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">Carregando planilha…</p>
          ) : crew.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Nenhum nome cadastrado ainda na coluna A da planilha.
            </p>
          ) : (
            <ol className="grid max-h-[560px] grid-cols-1 gap-1 overflow-y-auto pr-2 sm:grid-cols-2">
              {crew.map((name, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-lg px-3 py-1.5 transition-colors hover:bg-white/5"
                >
                  <span className="w-8 shrink-0 text-right text-sm font-semibold text-primary/80">
                    {i + 1}
                  </span>
                  <span
                    className="truncate font-semibold"
                    style={{ color: rankColor(i, Math.max(crew.length, 2)) }}
                  >
                    {name}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <aside className="glass flex flex-col items-center justify-center rounded-2xl p-8 text-center">
          <div className="float mb-4 text-5xl">💬</div>
          <h2 className="mb-3 text-2xl font-bold">
            <span className="gradient-shift">Comunidade</span>
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Avisos, recrutamento e tudo sobre a Zero Order acontecem no Discord.
          </p>
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pulse-glow rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105"
          >
            Entrar no Discord
          </a>
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-xs uppercase tracking-widest text-white/70 hover:text-white"
          >
            🔗 Compartilhar o site
          </a>
        </aside>
      </section>

      {/* Skilled / Mobile / PC / Console */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="mb-8 text-center text-4xl font-bold">
          <span className="gradient-shift">Rankings por Categoria</span>
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <RankList
            title="Skilled"
            emoji="⚔️"
            items={skilled}
            isLoading={isLoading}
            error={sheetError}
            emptyMsg="Nada na coluna C ainda."
          />
          <RankList
            title="Mobile"
            emoji="📱"
            items={mobile}
            isLoading={isLoading}
            error={sheetError}
            emptyMsg="Nada na coluna D ainda."
          />
          <RankList
            title="PC"
            emoji="🖥️"
            items={pc}
            isLoading={isLoading}
            error={sheetError}
            emptyMsg="Nada na coluna E ainda."
          />
          <RankList
            title="Console"
            emoji="🎮"
            items={consolePlayers}
            isLoading={isLoading}
            error={sheetError}
            emptyMsg="Nada na coluna F ainda."
          />
        </div>
      </section>

      {/* O que a crew vai ter */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-8 text-center text-4xl font-bold">
          <span className="gradient-shift">O Que a Crew Vai Ter</span>
        </h2>
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
        <h2 className="mb-8 text-center text-4xl font-bold">
          <span className="gradient-shift">Placar — Top S.A</span>
        </h2>
        <div className="glass overflow-hidden rounded-2xl">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Carregando…</div>
          ) : topSA.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhum nome cadastrado ainda na coluna B da planilha.
            </div>
          ) : (
            topSA.map((name, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border/50 px-6 py-4 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl font-black text-primary">#{i + 1}</span>
                  <span
                    className="text-lg font-semibold"
                    style={{ color: rankColor(i, Math.max(topSA.length, 2)) }}
                  >
                    {name}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Recursos Blox Fruits */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-8 text-center text-4xl font-bold">
          <span className="gradient-shift">Recursos de Blox Fruits</span>
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <a
            href="https://blox-fruits.fandom.com/wiki/Blox_Fruits_Wiki"
            target="_blank"
            rel="noopener noreferrer"
            className="glass block rounded-2xl p-6 transition-transform hover:scale-[1.03]"
          >
            <div className="mb-3 text-3xl">📖</div>
            <h3 className="mb-2 text-xl font-bold text-primary">Wiki Oficial</h3>
            <p className="text-sm text-foreground/85">
              Guia completo de frutas, ilhas, chefes, quests e builds.
            </p>
          </a>
          <a
            href="https://trello.com/b/i6yj1x0Q/blox-fruits"
            target="_blank"
            rel="noopener noreferrer"
            className="glass block rounded-2xl p-6 transition-transform hover:scale-[1.03]"
          >
            <div className="mb-3 text-3xl">📰</div>
            <h3 className="mb-2 text-xl font-bold text-primary">Boletim / Trello</h3>
            <p className="text-sm text-foreground/85">
              Todas as novidades, atualizações e patch notes direto dos devs.
            </p>
          </a>
          <a
            href="https://www.roblox.com/games/2753915549/Blox-Fruits"
            target="_blank"
            rel="noopener noreferrer"
            className="glass block rounded-2xl p-6 transition-transform hover:scale-[1.03]"
          >
            <div className="mb-3 text-3xl">🎮</div>
            <h3 className="mb-2 text-xl font-bold text-primary">Jogar Blox Fruits</h3>
            <p className="text-sm text-foreground/85">
              Entre no jogo e junte-se à Zero Order rumo ao topo.
            </p>
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="mb-8 text-center text-4xl font-bold">
          <span className="gradient-shift">Perguntas Frequentes</span>
        </h2>
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
          <p className="mt-2 text-3xl font-black">
            <span className="gradient-shift">ZeroCute</span>
          </p>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © 2026 Zero Order — Rumo ao topo dos servidores de Blox Fruits.
        </p>
      </footer>
    </div>
  );
}
