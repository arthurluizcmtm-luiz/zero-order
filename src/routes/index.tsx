import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  DISCORD_URL,
  SITE_URL,
  CREW_DESCRIPTION,
  FEATURES,
  FAQ,
  PIX_KEY,
  REGIONS,
} from "@/lib/crew-data";
import { fetchSheetData } from "@/lib/sheet.functions";
import {
  fetchDiscordUser,
  fetchDiscordInvite,
  discordProfileUrl,
  youtubeId,
  type DiscordUser,
  type DiscordInviteInfo,
} from "@/lib/discord";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import ThemeCustomizer from "@/components/ThemeCustomizer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { property: "og:image", content: `${SITE_URL}/og-image.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: `${SITE_URL}/og-image.jpg` },
      { property: "og:url", content: SITE_URL },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
});

function rankColor(index: number, total: number): string {
  const t = total <= 1 ? 0 : index / (total - 1);
  return `color-mix(in srgb, var(--theme-primary) ${100 - t * 100}%, var(--theme-secondary))`;
}

function ComingSoon() {
  return (
    <div className="flex items-center justify-center py-8 text-center">
      <p className="gradient-shift text-xl font-bold tracking-widest">Coming Soon...</p>
    </div>
  );
}

function RankList({
  title,
  items,
  emoji,
  isLoading,
  error,
}: {
  title: string;
  items: string[];
  emoji: string;
  isLoading: boolean;
  error?: string;
}) {
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
        <ComingSoon />
      ) : (
        <ol className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {items.map((name, i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-white/5">
              <span className="w-7 shrink-0 text-right text-xs font-semibold text-primary/80">{i + 1}</span>
              <span className="truncate font-semibold" style={{ color: rankColor(i, Math.max(items.length, 2)) }}>
                {name}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function DiscordCard({ id, rank }: { id: string; rank: number }) {
  const { data } = useQuery<DiscordUser>({
    queryKey: ["discord-user", id],
    queryFn: () => fetchDiscordUser(id),
    staleTime: 5 * 60_000,
  });
  const u = data ?? { id, username: id, handle: id, avatarUrl: "" };
  return (
    <div className="glass flex items-center gap-4 rounded-2xl p-4">
      <span className="w-8 shrink-0 text-2xl font-black text-primary">#{rank}</span>
      <img
        src={u.avatarUrl}
        alt={u.username}
        className="h-14 w-14 rounded-full border-2 border-primary/60 object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold text-white">{u.username}</p>
        <p className="truncate text-xs text-white/60">@{u.handle}</p>
      </div>
      <a
        href={discordProfileUrl(id)}
        target="_blank"
        rel="noopener noreferrer"
        className="pulse-glow shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:scale-105"
      >
        Ver perfil
      </a>
    </div>
  );
}


function DiscordInviteBanner({ url }: { url: string }) {
  const { data } = useQuery<DiscordInviteInfo | null>({
    queryKey: ["discord-invite", url],
    queryFn: () => fetchDiscordInvite(url),
    staleTime: 5 * 60_000,
  });
  return (
    <aside className="glass flex flex-col items-center justify-center rounded-2xl p-8 text-center">
      {data?.iconUrl ? (
        <img
          src={data.iconUrl}
          alt={data.guildName}
          className="mb-3 h-20 w-20 rounded-full border-2 border-primary/60"
        />
      ) : (
        <div className="float mb-4 text-5xl">💬</div>
      )}
      <h2 className="mb-1 text-2xl font-bold">
        <span className="gradient-shift">{data?.guildName || "Comunidade"}</span>
      </h2>
      {data?.memberCount != null && (
        <p className="mb-4 text-xs text-white/60">
          👥 {data.memberCount} membros · 🟢 {data.presenceCount ?? 0} online
        </p>
      )}
      <p className="mb-6 text-sm text-muted-foreground">
        Avisos, recrutamento e tudo sobre a Zero Order acontecem no Discord.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="pulse-glow rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg hover:scale-105"
      >
        Entrar no Discord
      </a>
    </aside>
  );
}

function PixDonate() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <div className="glass rounded-2xl p-6 text-center">
      <p className="text-sm uppercase tracking-widest text-white/70">
        Ajudar a criação do site por meio de Donate
      </p>
      <p className="mt-1 text-xs text-white/50">
        Feito com carinho por <span className="font-bold text-white">ZeroCute</span>
      </p>
      <div className="mt-4 rounded-xl border border-white/15 bg-black/40 p-3">
        <p className="text-[10px] uppercase tracking-widest text-white/50">Chave PIX</p>
        <p className="mt-1 break-all font-mono text-sm text-white">{PIX_KEY}</p>
      </div>
      <button
        onClick={copy}
        className="pulse-glow mt-4 rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground hover:scale-105"
      >
        {copied ? "✅ Copiado!" : "📋 Copiar chave PIX"}
      </button>
    </div>
  );
}

function YouTubeEmbed({ url }: { url: string }) {
  const id = youtubeId(url);
  if (!id) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="glass block rounded-2xl p-4 text-sm text-primary underline">
        {url}
      </a>
    );
  }
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </div>
  );
}

function RegionServers({ regions, topSA }: { regions: string[]; topSA: string[] }) {
  return (
    <div className="space-y-8">
      <div className="glass rounded-2xl p-6">
        <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold">
          <span>👑</span>
          <span className="gradient-shift">Placar Top S.A</span>
        </h3>
        {topSA.length === 0 ? (
          <ComingSoon />
        ) : (
          <div className="grid gap-3">
            {topSA.map((id, i) => (
              <DiscordCard key={id + i} id={id} rank={i + 1} />
            ))}
          </div>
        )}
      </div>

      {REGIONS.map((r) => {
        const slice = regions.slice(r.start, r.end).map((v) => v.trim()).filter(Boolean);
        return (
          <div key={r.key} className="glass rounded-2xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold">
              <span>{r.flag}</span>
              <span className="gradient-shift">Top {r.label}</span>
            </h3>
            {slice.length === 0 ? (
              <ComingSoon />
            ) : (
              <div className="grid gap-3">
                {slice.map((id, i) => (
                  <DiscordCard key={id + i} id={id} rank={i + 1} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PrivateServersList({ items }: { items: string[] }) {
  if (items.length === 0) return <ComingSoon />;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((link, i) => (
        <a
          key={i}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="glass flex items-center gap-3 rounded-xl px-4 py-3 transition hover:scale-[1.02] hover:border-primary/60"
        >
          <span className="text-2xl">🎮</span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
            Servidor privado #{i + 1}
          </span>
          <span className="shrink-0 text-xs text-primary">Entrar ↗</span>
        </a>
      ))}
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
  const sheetFaq = data?.faq ?? [];
  const news = data?.news ?? [];
  const giveaways = data?.giveaways ?? [];
  const regions = data?.regions ?? [];
  const youtube = data?.youtube ?? [];
  const privateServers = data?.privateServers ?? [];
  const sheetError = data?.error;
  const discordUrl = data?.discordUrl?.trim() || DISCORD_URL;
  const faqItems = sheetFaq.length > 0 ? sheetFaq : FAQ;

  return (
    <div className="min-h-screen font-body">
      <ThemeCustomizer />

      {/* Hero */}
      <header className="mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.5em] text-primary/80">Blox Fruits Crew</p>
        <h1 className="float text-6xl font-black tracking-wider md:text-8xl">
          <span className="gradient-shift">ZERO ORDER</span>
        </h1>
        <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-foreground/90 md:text-xl">
          {CREW_DESCRIPTION}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <div className="rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs uppercase tracking-widest">
            Fundada em 14/07/26
          </div>
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pulse-glow rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:scale-105"
          >
            💬 Entrar no Discord
          </a>
        </div>
      </header>

      {sheetError && (
        <section className="mx-auto max-w-6xl px-6">
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200/90">
            {sheetError}
          </div>
        </section>
      )}

      {/* Crew + Discord */}
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-3">
        <div className="glass rounded-2xl p-6 md:col-span-2">
          <h2 className="mb-6 text-center text-3xl font-bold">
            <span className="gradient-shift">Os Melhores da Crew</span>
          </h2>
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">Carregando planilha…</p>
          ) : crew.length === 0 ? (
            <ComingSoon />
          ) : (
            <div className="grid max-h-[640px] gap-3 overflow-y-auto pr-2 sm:grid-cols-2">
              {crew.map((id, i) => (
                <DiscordCard key={id + i} id={id} rank={i + 1} />
              ))}
            </div>
          )}
        </div>
        <DiscordInviteBanner url={discordUrl} />
      </section>

      {/* Tabs principais */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <Tabs defaultValue="rankings" className="w-full">
          <TabsList className="mx-auto mb-8 flex h-auto w-full max-w-4xl flex-wrap justify-center gap-1 bg-white/5 p-1.5 backdrop-blur">
            <TabsTrigger value="rankings">🏆 Rankings</TabsTrigger>
            <TabsTrigger value="regions">🌍 Regiões & Top S.A</TabsTrigger>
            <TabsTrigger value="servers">🔗 Servidores</TabsTrigger>
            <TabsTrigger value="features">⚔️ Crew</TabsTrigger>
            <TabsTrigger value="news">📢 News</TabsTrigger>
            <TabsTrigger value="giveaways">🎁 Sorteios</TabsTrigger>
            <TabsTrigger value="videos">📺 Vídeos</TabsTrigger>
            <TabsTrigger value="resources">📖 Recursos</TabsTrigger>
            <TabsTrigger value="faq">❓ FAQ</TabsTrigger>
          </TabsList>

          {/* Rankings por Categoria */}
          <TabsContent value="rankings">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <RankList title="Skilled" emoji="⚔️" items={skilled} isLoading={isLoading} error={sheetError} />
              <RankList title="Mobile" emoji="📱" items={mobile} isLoading={isLoading} error={sheetError} />
              <RankList title="PC" emoji="🖥️" items={pc} isLoading={isLoading} error={sheetError} />
              <RankList title="Console" emoji="🎮" items={consolePlayers} isLoading={isLoading} error={sheetError} />
            </div>
          </TabsContent>

          {/* Top S.A + Regionais (por Discord ID) */}
          <TabsContent value="regions">
            {isLoading ? (
              <p className="text-center text-sm text-muted-foreground">Carregando…</p>
            ) : (
              <RegionServers regions={regions} topSA={topSA} />
            )}
          </TabsContent>

          {/* Servidores privados (coluna L) */}
          <TabsContent value="servers">
            <div className="glass rounded-2xl p-6">
              <h3 className="mb-4 text-2xl font-bold">
                <span className="gradient-shift">Servidores Privados</span>
              </h3>
              {isLoading ? (
                <p className="text-center text-sm text-muted-foreground">Carregando…</p>
              ) : (
                <PrivateServersList items={privateServers} />
              )}
            </div>
          </TabsContent>

          {/* Crew features */}
          <TabsContent value="features">
            <div className="grid gap-6 md:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="glass rounded-2xl p-6">
                  <h3 className="mb-3 text-2xl font-bold text-primary">{f.title}</h3>
                  <p className="leading-relaxed text-foreground/85">{f.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* News */}
          <TabsContent value="news">
            {news.length === 0 ? (
              <ComingSoon />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {news.map((n, i) => (
                  <div key={i} className="glass rounded-2xl p-6">
                    <h3 className="mb-2 text-xl font-bold text-primary">{n.title}</h3>
                    <p className="leading-relaxed text-foreground/85">{n.description}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sorteios */}
          <TabsContent value="giveaways">
            {isLoading ? (
              <p className="text-center text-sm text-muted-foreground">Carregando…</p>
            ) : giveaways.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <div className="mb-3 text-5xl">🎁</div>
                <p className="gradient-shift text-2xl font-bold">Sem Sorteio no Momento</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {giveaways.map((g, i) => (
                  <div key={i} className="glass rounded-2xl p-6 text-center">
                    <div className="mb-3 text-3xl">🎁</div>
                    <h3 className="mb-2 text-xl font-bold text-primary">{g.prize}</h3>
                    <p className="text-sm uppercase tracking-widest text-white/80">
                      Termina em: <span className="font-bold text-white">{g.endsAt || "—"}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Vídeos YouTube */}
          <TabsContent value="videos">
            {youtube.length === 0 ? (
              <ComingSoon />
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {youtube.map((url, i) => (
                  <YouTubeEmbed key={i} url={url} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recursos externos */}
          <TabsContent value="resources">
            <div className="grid gap-6 md:grid-cols-3">
              <a href="https://blox-fruits.fandom.com/wiki/Blox_Fruits_Wiki" target="_blank" rel="noopener noreferrer" className="glass block rounded-2xl p-6 hover:scale-[1.03]">
                <div className="mb-3 text-3xl">📖</div>
                <h3 className="mb-2 text-xl font-bold text-primary">Wiki Oficial</h3>
                <p className="text-sm text-foreground/85">Guia completo de frutas, ilhas, chefes, quests e builds.</p>
              </a>
              <a href="https://gamerrobot.com/blogs/news" target="_blank" rel="noopener noreferrer" className="glass block rounded-2xl p-6 hover:scale-[1.03]">
                <div className="mb-3 text-3xl">📰</div>
                <h3 className="mb-2 text-xl font-bold text-primary">Boletim Oficial</h3>
                <p className="text-sm text-foreground/85">Novidades, atualizações e patch notes direto da Gamer Robot.</p>
              </a>
              <a href="https://www.roblox.com/games/2753915549/Blox-Fruits" target="_blank" rel="noopener noreferrer" className="glass block rounded-2xl p-6 hover:scale-[1.03]">
                <div className="mb-3 text-3xl">🎮</div>
                <h3 className="mb-2 text-xl font-bold text-primary">Jogar Blox Fruits</h3>
                <p className="text-sm text-foreground/85">Entre no jogo e junte-se à Zero Order rumo ao topo.</p>
              </a>
            </div>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq">
            <div className="mx-auto max-w-3xl">
              {faqItems.length === 0 ? (
                <ComingSoon />
              ) : (
                <div className="glass max-h-[600px] overflow-y-auto rounded-2xl p-4">
                  <Accordion type="single" collapsible className="w-full">
                    {faqItems.map((item, i) => (
                      <AccordionItem key={i} value={`faq-${i}`} className="border-white/10">
                        <AccordionTrigger className="text-left text-base font-bold text-primary hover:no-underline">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="leading-relaxed text-foreground/85">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Donate + Footer */}
      <footer className="mx-auto max-w-6xl px-6 py-12">
        <div className="mx-auto max-w-md">
          <PixDonate />
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © 2026 Zero Order — Rumo ao topo dos servidores de Blox Fruits.
        </p>
      </footer>
    </div>
  );
}
