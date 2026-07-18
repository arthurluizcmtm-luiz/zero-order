// Utilitários client-side para buscar dados públicos do Discord.

export type DiscordUser = {
  id: string;
  username: string; // display name (global_name)
  handle: string;   // @username
  avatarUrl: string;
};

export type DiscordInviteInfo = {
  guildId: string;
  guildName: string;
  iconUrl: string | null;
  memberCount?: number;
  presenceCount?: number;
};

// Formato aceito nas células da planilha:
//   <@1234567890> ZeroCute <True>
//   <@1234567890> ZeroCute <False>
//   <@1234567890>                (só o ID)
//   ZeroCute                     (só nome, sem ID)
//   1234567890                   (ID cru, mantém compatibilidade)
// Regras:
// - <@ID> extrai o Discord ID (opcionalmente com !)
// - Qualquer texto FORA de <...> é o nome fallback
// - <True> força usar o nome fallback (não puxa do Discord)
// - <False> ou ausência = puxa do Discord; se falhar, usa o fallback
export type DiscordEntry = {
  raw: string;
  id: string | null;
  fallbackName: string;
  forceFallback: boolean;
};

export function parseDiscordEntry(raw: string): DiscordEntry | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  // Sempre o PRIMEIRO <...> é o ID (aceita <@ID>, <@!ID> ou <ID>).
  const firstTag = s.match(/<@?!?(\d{5,25})>/);
  const id: string | null = firstTag ? firstTag[1] : null;
  // Flag opcional <True> / <False> em qualquer posição.
  const flagMatch = s.match(/<\s*(true|false)\s*>/i);
  // Nome fallback = tudo fora de qualquer <...>
  const name = s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const fallbackName = name && !/^\d{5,25}$/.test(name) ? name : "";
  const rawId = !id && /^\d{5,25}$/.test(s) ? s : null; // compat: célula com só o ID cru
  return {
    raw: s,
    id: id ?? rawId,
    fallbackName,
    forceFallback: flagMatch ? flagMatch[1].toLowerCase() === "true" : false,
  };
}

const AVATAR_FALLBACK = (id: string) => {
  const n = Number(BigInt(id || "0") % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${n}.png`;
};

// Cache em memória + sessionStorage para respostas instantâneas em re-renders.
const memCache = new Map<string, DiscordUser>();
const inflight = new Map<string, Promise<DiscordUser>>();

function readSession(id: string): DiscordUser | null {
  try {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem("dc:" + id) : null;
    return raw ? (JSON.parse(raw) as DiscordUser) : null;
  } catch { return null; }
}
function writeSession(id: string, u: DiscordUser) {
  try { if (typeof window !== "undefined") sessionStorage.setItem("dc:" + id, JSON.stringify(u)); } catch {}
}

function normalize(clean: string, raw: any): DiscordUser | null {
  const d = raw?.data ?? raw;
  if (!d) return null;
  const username = d.global_name || d.globalName || d.username || null;
  const handle = d.username || d.tag?.split("#")[0] || null;
  // Prefer animated (gif) quando disponível.
  let avatar: string | null =
    d.avatarURL ||
    d.avatar?.link ||
    (typeof d.avatar === "string" && d.avatar.startsWith("http") ? d.avatar : null);
  // Se veio o hash do avatar, monta URL com gif animado se começar com "a_".
  const hash = typeof d.avatar === "string" && !d.avatar.startsWith("http") ? d.avatar : d.avatar?.id;
  if (!avatar && hash) {
    const ext = String(hash).startsWith("a_") ? "gif" : "png";
    avatar = `https://cdn.discordapp.com/avatars/${clean}/${hash}.${ext}?size=256`;
  }
  if (!username && !avatar) return null;
  return {
    id: clean,
    username: username || clean,
    handle: handle || clean,
    avatarUrl: avatar || AVATAR_FALLBACK(clean),
  };
}

export async function fetchDiscordUser(id: string): Promise<DiscordUser> {
  const clean = id.trim();
  const fallback: DiscordUser = {
    id: clean, username: clean, handle: clean, avatarUrl: AVATAR_FALLBACK(clean),
  };
  if (!/^\d{5,25}$/.test(clean)) return fallback;
  if (memCache.has(clean)) return memCache.get(clean)!;
  const cached = readSession(clean);
  if (cached) { memCache.set(clean, cached); return cached; }
  if (inflight.has(clean)) return inflight.get(clean)!;

  const endpoints = [
    `https://japi.rest/discord/v1/user/${clean}`,
    `https://discordlookup.mesalytic.moe/v1/user/${clean}`,
  ];
  // Corrida: retorna o primeiro que responder com dados válidos.
  const p = (async () => {
    try {
      const user = await Promise.any(
        endpoints.map(async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error("bad");
          const data = await res.json();
          const u = normalize(clean, data);
          if (!u) throw new Error("empty");
          return u;
        }),
      );
      memCache.set(clean, user);
      writeSession(clean, user);
      return user;
    } catch {
      return fallback;
    } finally {
      inflight.delete(clean);
    }
  })();
  inflight.set(clean, p);
  return p;
}

export function discordProfileUrl(id: string): string {
  return `https://discord.com/users/${id}`;
}

// Extrai o código de um convite (aceita URL ou só o código).
export function extractInviteCode(input: string): string | null {
  if (!input) return null;
  const m = input.match(/(?:discord\.gg\/|discord\.com\/invite\/)([A-Za-z0-9-]+)/);
  if (m) return m[1];
  if (/^[A-Za-z0-9-]{2,32}$/.test(input.trim())) return input.trim();
  return null;
}

export async function fetchDiscordInvite(inviteUrl: string): Promise<DiscordInviteInfo | null> {
  const code = extractInviteCode(inviteUrl);
  if (!code) return null;
  try {
    const res = await fetch(
      `https://discord.com/api/v10/invites/${code}?with_counts=true`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const guild = data.guild;
    if (!guild) return null;
    const iconUrl = guild.icon
      ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith("a_") ? "gif" : "png"}?size=256`
      : null;
    return {
      guildId: guild.id,
      guildName: guild.name,
      iconUrl,
      memberCount: data.approximate_member_count,
      presenceCount: data.approximate_presence_count,
    };
  } catch {
    return null;
  }
}

// Extrai video ID do YouTube de várias formas de URL.
export function youtubeId(url: string): string | null {
  const s = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{6,})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return m[1];
  }
  return null;
}
