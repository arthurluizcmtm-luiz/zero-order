import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
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
  discordProfileUrl,
  youtubeId,
  parseDiscordEntry,
  type DiscordUser,
} from "@/lib/discord";
import type { SheetData } from "@/lib/sheet.functions";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import ThemeCustomizer from "@/components/ThemeCustomizer";
import MusicPlayer from "@/components/MusicPlayer";
import SourceGuard from "@/components/SourceGuard";

// Rota interna que redireciona para o convite (link real nunca vai ao cliente).
const JOIN_URL = "/api/public/join";



export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { property: "og:image", content: `${SITE_URL}/__l5e/assets-v1/d48dd19d-fd30-439f-bdd7-7f0dc4e0c043/zero-order-social.png` },
      { property: "og:image:width", content: "1500" },
      { property: "og:image:height", content: "1000" },
      { name: "twitter:image", content: `${SITE_URL}/__l5e/assets-v1/d48dd19d-fd30-439f-bdd7-7f0dc4e0c043/zero-order-social.png` },
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

function DiscordCard({ entry, rank }: { entry: string; rank: number }) {
  const parsed = parseDiscordEntry(entry);
  const id = parsed?.id ?? "";
  const fallbackName = parsed?.fallbackName || (id ? `User ${id.slice(-4)}` : entry);
  const shouldFetch = !!id && !parsed?.forceFallback;

  const { data } = useQuery<DiscordUser>({
    queryKey: ["discord-user", id],
    queryFn: () => fetchDiscordUser(id),
    staleTime: 30_000,
    refetchOnMount: true,
    retry: 2,
    enabled: shouldFetch,
  });

  const displayName =
    parsed?.forceFallback && fallbackName
      ? fallbackName
      : data?.username || fallbackName || (id ? "Zero Order" : entry);
  const handle = data?.handle || fallbackName || "";
  const avatarUrl =
    data?.avatarUrl ||
    (id ? `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(id) % 6n)}.png` : "");

  return (
    <div className="glass flex items-center gap-4 rounded-2xl p-4">
      <span className="w-8 shrink-0 text-2xl font-black text-primary">#{rank}</span>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="h-14 w-14 rounded-full border-2 border-primary/60 object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/60 bg-white/5 text-lg font-black text-primary">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold text-white">{displayName}</p>
        {handle && handle !== displayName && (
          <p className="truncate text-xs text-white/60">@{handle}</p>
        )}
      </div>
      {id && (
        <a
          href={discordProfileUrl(id)}
          target="_blank"
          rel="noopener noreferrer"
          className="pulse-glow shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:scale-105"
        >
          Ver perfil
        </a>
      )}
    </div>
  );
}


function DiscordInviteBanner({ data }: { data: SheetData["discord"] }) {
  return (
    <aside className="glass glow-ring flex flex-col items-center justify-center rounded-2xl p-8 text-center">
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
        href={JOIN_URL}
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

type Platform = "geral" | "mobile" | "pc" | "console";

const PLATFORMS: { key: Platform; label: string; icon: string }[] = [
  { key: "geral", label: "Geral", icon: "🌐" },
  { key: "mobile", label: "Mobile", icon: "📱" },
  { key: "pc", label: "PC", icon: "🖥️" },
  { key: "console", label: "Console", icon: "🎮" },
];

function RegionsDashboard({ data }: { data: SheetData | undefined }) {
  const [platform, setPlatform] = useState<Platform>("geral");
  const [openRegion, setOpenRegion] = useState<string | null>(null);

  const source =
    platform === "mobile" ? data?.regionsMobile
    : platform === "pc" ? data?.regionsPc
    : platform === "console" ? data?.regionsConsole
    : data?.regions;
  const slots = source ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPlatform(p.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition ${
              platform === p.key
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.6)]"
                : "border border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REGIONS.map((r) => {
          const list = slots.slice(r.start, r.end).map((v) => v.trim()).filter(Boolean);
          const expanded = openRegion === r.key;
          return (
            <div key={r.key} className="glass rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em]">
                  <span className="text-lg">{r.flag}</span>
                  <span className="gradient-shift">{r.label}</span>
                </h3>
                <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/60">
                  {list.length}/10
                </span>
              </div>
              {list.length === 0 ? (
                <p className="py-4 text-center text-xs uppercase tracking-widest text-white/40">
                  Coming Soon...
                </p>
              ) : (
                <>
                  <div className="grid gap-2">
                    {(expanded ? list : list.slice(0, 3)).map((id, i) => (
                      <DiscordCard key={id + i} entry={id} rank={i + 1} />
                    ))}
                  </div>
                  {list.length > 3 && (
                    <button
                      onClick={() => setOpenRegion(expanded ? null : r.key)}
                      className="mt-3 w-full rounded-full border border-white/15 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/10"
                    >
                      {expanded ? "Fechar" : `Ver top 10 →`}
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
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

function WarLogSection({
  record,
  logs,
  isLoading,
}: {
  record: import("@/lib/sheet.functions").WarRecord | null;
  logs: import("@/lib/sheet.functions").WarLogItem[];
  isLoading: boolean;
}) {
  const parseLog = (lines: string[]) => {
    let vsIdx = lines.findIndex((l) => /^vs\.?$/i.test(l));
    if (vsIdx < 0) vsIdx = Math.floor(lines.length / 2);
    const header = lines.slice(0, 1);
    const teamA: string[] = [];
    const teamB: string[] = [];
    const meta: { label: string; value: string; type: "score" | "notes" | "result" }[] = [];
    let side: "A" | "B" = "A";
    for (let i = 1; i < lines.length; i++) {
      const l = lines[i];
      if (/^vs\.?$/i.test(l)) { side = "B"; continue; }
      const mScore = l.match(/^placar\s*:\s*(.+)$/i);
      const mNotes = l.match(/^notes?\s*:\s*(.+)$/i);
      const mResult = l.match(/^zero order\s+(wins?|lose[sd]?)/i);
      if (mScore) { meta.push({ label: "Placar", value: mScore[1], type: "score" }); continue; }
      if (mNotes) { meta.push({ label: "Notes", value: mNotes[1], type: "notes" }); continue; }
      if (mResult) { meta.push({ label: "", value: l, type: "result" }); continue; }
      (side === "A" ? teamA : teamB).push(l);
    }
    return { header: header[0] ?? "Zero Order", teamA, teamB, meta };
  };

  return (
    <div className="space-y-6">
      <div className="war-card p-8 text-center">
        <span className="war-corner" style={{ top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2 }} />
        <span className="war-corner" style={{ top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2 }} />
        <span className="war-corner" style={{ bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2 }} />
        <span className="war-corner" style={{ bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2 }} />
        <p className="mb-3 text-xs uppercase tracking-[0.5em] text-white/60">⚜ Placar Geral ⚜</p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : !record ? (
          <ComingSoon />
        ) : (
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-emerald-300/80">Wins</p>
              <p className="gradient-shift text-6xl font-black leading-none">{record.wins}</p>
            </div>
            <div className="war-vs text-4xl font-black text-primary">⚔</div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-red-300/80">Loses</p>
              <p className="text-6xl font-black leading-none text-white/60">{record.losses}</p>
            </div>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="mb-6 text-center text-3xl font-bold">
          <span className="text-primary">⚔</span>{" "}
          <span className="gradient-shift">War Logs</span>{" "}
          <span className="text-primary">⚔</span>
        </h3>
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground">Carregando…</p>
        ) : logs.length === 0 ? (
          <ComingSoon />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {logs.map((log, i) => {
              const p = parseLog(log.lines);
              const won = p.meta.find((m) => m.type === "result" && /win/i.test(m.value));
              const lost = p.meta.find((m) => m.type === "result" && /lose/i.test(m.value));
              return (
                <article key={i} className="war-card p-6">
                  <span className="war-corner" style={{ top: 6, left: 6, borderTopWidth: 2, borderLeftWidth: 2 }} />
                  <span className="war-corner" style={{ top: 6, right: 6, borderTopWidth: 2, borderRightWidth: 2 }} />
                  <span className="war-corner" style={{ bottom: 6, left: 6, borderBottomWidth: 2, borderLeftWidth: 2 }} />
                  <span className="war-corner" style={{ bottom: 6, right: 6, borderBottomWidth: 2, borderRightWidth: 2 }} />

                  <p className="mb-4 text-center text-[10px] uppercase tracking-[0.4em] text-white/50">
                    ✦ War #{i + 1} ✦
                  </p>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="text-center">
                      <p className="gradient-shift text-lg font-black">{p.header}</p>
                      <div className="mt-2 space-y-1">
                        {p.teamA.map((l, k) => (
                          <p key={k} className="text-sm text-white/90">🏴‍☠️ {l}</p>
                        ))}
                      </div>
                    </div>
                    <div className="war-vs text-3xl text-primary">⚔</div>
                    <div className="text-center">
                      <p className="text-lg font-black text-white/80">Inimigos</p>
                      <div className="mt-2 space-y-1">
                        {p.teamB.map((l, k) => (
                          <p key={k} className="text-sm text-white/90">☠️ {l}</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {p.meta.filter((m) => m.type !== "result").length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-center">
                      {p.meta.filter((m) => m.type === "score").map((m, k) => (
                        <p key={k} className="text-sm">
                          <span className="text-[10px] uppercase tracking-widest text-white/50">{m.label} </span>
                          <span className="gradient-shift text-xl font-black">{m.value}</span>
                        </p>
                      ))}
                      {p.meta.filter((m) => m.type === "notes").map((m, k) => (
                        <p key={k} className="text-xs italic text-white/70">📝 {m.value}</p>
                      ))}
                    </div>
                  )}

                  {(won || lost) && (
                    <div
                      className={`mt-4 rounded-full py-2 text-center text-xs font-black uppercase tracking-[0.3em] ${
                        won
                          ? "bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                          : "bg-red-500/20 text-red-300 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                      }`}
                    >
                      {won ? "🏆 Zero Order Wins" : "💀 Zero Order Lose"}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}




type SectionKey =
  | "home" | "crew" | "regions" | "rankings" | "warlog"
  | "servers" | "news" | "giveaways" | "videos" | "resources" | "faq" | "donate";

const NAV: { key: SectionKey; label: string; icon: string }[] = [
  { key: "home", label: "Início", icon: "🏠" },
  { key: "crew", label: "Melhores da Crew", icon: "👑" },
  { key: "regions", label: "Regiões", icon: "🌍" },
  { key: "rankings", label: "Rankings", icon: "🏆" },
  { key: "warlog", label: "War Log", icon: "⚔️" },
  { key: "servers", label: "Servidores", icon: "🔗" },
  { key: "news", label: "News", icon: "📢" },
  { key: "giveaways", label: "Sorteios", icon: "🎁" },
  { key: "videos", label: "Vídeos", icon: "📺" },
  { key: "resources", label: "Recursos", icon: "📖" },
  { key: "faq", label: "FAQ", icon: "❓" },
  { key: "donate", label: "Donate", icon: "💖" },
];

function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="flex items-center gap-3 text-3xl font-black">
        <span>{icon}</span>
        <span className="gradient-shift">{title}</span>
      </h2>
      {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
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

  const [section, setSection] = useState<SectionKey>("home");

  const crew = data?.crew ?? [];
  const warRecord = data?.warRecord ?? null;
  const warLogs = data?.warLogs ?? [];
  const skilled = data?.skilled ?? [];
  const mobile = data?.mobile ?? [];
  const pc = data?.pc ?? [];
  const consolePlayers = data?.console ?? [];
  const sheetFaq = data?.faq ?? [];
  const news = data?.news ?? [];
  const giveaways = data?.giveaways ?? [];
  const youtube = data?.youtube ?? [];
  const privateServers = data?.privateServers ?? [];
  const musicUrl = "";
  const sheetError = data?.error;
  const discordUrl = data?.discordUrl?.trim() || DISCORD_URL;
  const faqItems = sheetFaq.length > 0 ? sheetFaq : FAQ;

  return (
    <div className="min-h-screen font-body">
      <ThemeCustomizer />
      {musicUrl && <MusicPlayer url={musicUrl} />}

      <div className="mx-auto flex max-w-[1500px] flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto">
          <div className="glass m-3 rounded-2xl p-4 lg:m-4">
            <div className="mb-5 text-center">
              <p className="text-[10px] uppercase tracking-[0.4em] text-primary/80">Blox Fruits Crew</p>
              <h1 className="gradient-shift text-2xl font-black tracking-wider">ZERO ORDER</h1>
            </div>
            <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {NAV.map((n) => (
                <button
                  key={n.key}
                  onClick={() => setSection(n.key)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition lg:w-full ${
                    section === n.key
                      ? "bg-primary/20 text-white shadow-[inset_0_0_0_1px_rgba(var(--theme-primary-rgb),0.6)]"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{n.icon}</span>
                  <span className="whitespace-nowrap">{n.label}</span>
                </button>
              ))}
            </nav>
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pulse-glow mt-5 block rounded-xl bg-primary px-4 py-2 text-center text-xs font-black uppercase tracking-widest text-primary-foreground hover:scale-[1.03]"
            >
              💬 Discord
            </a>
          </div>
        </aside>

        {/* Conteúdo */}
        <main className="min-w-0 flex-1 px-4 py-4 lg:px-8 lg:py-8">
          {sheetError && (
            <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200/90">
              {sheetError}
            </div>
          )}

          {section === "home" && (
            <div className="space-y-6">
              <div className="glass relative overflow-hidden rounded-3xl p-8 text-center md:p-12">
                <h2 className="float text-5xl font-black tracking-wider md:text-7xl">
                  <span className="gradient-shift">ZERO ORDER</span>
                </h2>
                <p className="mx-auto mt-6 max-w-3xl leading-relaxed text-foreground/90">
                  {CREW_DESCRIPTION}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs uppercase tracking-widest">
                    Fundada em 14/07/26
                  </span>
                  <button
                    onClick={() => setSection("regions")}
                    className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-widest hover:bg-white/10"
                  >
                    Ver rankings →
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="glass rounded-2xl p-6 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-white/50">Melhores da Crew</p>
                  <p className="gradient-shift text-5xl font-black">{crew.length}</p>
                </div>
                <div className="glass rounded-2xl p-6 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-white/50">Wars vencidas</p>
                  <p className="gradient-shift text-5xl font-black">{warRecord?.wins ?? 0}</p>
                </div>
                <div className="glass rounded-2xl p-6 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-white/50">Sorteios ativos</p>
                  <p className="gradient-shift text-5xl font-black">{giveaways.length}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <RegionsDashboard data={data} />
                </div>
                <DiscordInviteBanner url={discordUrl} />
              </div>
            </div>
          )}

          {section === "crew" && (
            <div>
              <SectionTitle icon="👑" title="Os Melhores da Crew" subtitle="Coluna A da planilha" />
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando planilha…</p>
              ) : crew.length === 0 ? (
                <ComingSoon />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {crew.map((id, i) => (
                    <DiscordCard key={id + i} entry={id} rank={i + 1} />
                  ))}
                </div>
              )}
            </div>
          )}

          {section === "regions" && (
            <div>
              <SectionTitle icon="🌍" title="Regiões" subtitle="Top 10 por região e plataforma" />
              <RegionsDashboard data={data} />
            </div>
          )}

          {section === "rankings" && (
            <div>
              <SectionTitle icon="🏆" title="Rankings por Categoria" />
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <RankList title="Skilled" emoji="⚔️" items={skilled} isLoading={isLoading} error={sheetError} />
                <RankList title="Mobile" emoji="📱" items={mobile} isLoading={isLoading} error={sheetError} />
                <RankList title="PC" emoji="🖥️" items={pc} isLoading={isLoading} error={sheetError} />
                <RankList title="Console" emoji="🎮" items={consolePlayers} isLoading={isLoading} error={sheetError} />
              </div>
            </div>
          )}

          {section === "warlog" && (
            <div>
              <SectionTitle icon="⚔️" title="War Log" />
              <WarLogSection record={warRecord} logs={warLogs} isLoading={isLoading} />
            </div>
          )}

          {section === "servers" && (
            <div>
              <SectionTitle icon="🔗" title="Servidores Privados" subtitle="Clique e entre direto no Roblox" />
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : (
                <PrivateServersList items={privateServers} />
              )}
            </div>
          )}

          {section === "news" && (
            <div>
              <SectionTitle icon="📢" title="News do Server" />
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
            </div>
          )}

          {section === "giveaways" && (
            <div>
              <SectionTitle icon="🎁" title="Sorteios" />
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
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
            </div>
          )}

          {section === "videos" && (
            <div>
              <SectionTitle icon="📺" title="Vídeos" />
              {youtube.length === 0 ? (
                <ComingSoon />
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {youtube.map((url, i) => (
                    <YouTubeEmbed key={i} url={url} />
                  ))}
                </div>
              )}
            </div>
          )}

          {section === "resources" && (
            <div>
              <SectionTitle icon="📖" title="Recursos de Blox Fruits" />
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
            </div>
          )}

          {section === "faq" && (
            <div className="mx-auto max-w-3xl">
              <SectionTitle icon="❓" title="FAQ" />
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
          )}

          {section === "donate" && (
            <div className="mx-auto max-w-md">
              <SectionTitle icon="💖" title="Donate" />
              <PixDonate />
            </div>
          )}

          <div className="mt-10">
            <SectionTitle icon="👑" title="O que a Zero Order tem" />
            <div className="grid gap-4 md:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="glass rounded-2xl p-6">
                  <h3 className="mb-2 text-xl font-bold text-primary">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-foreground/85">{f.description}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            © 2026 Zero Order — Site criado por ZeroCute.
          </p>
        </main>
      </div>
    </div>
  );
}

