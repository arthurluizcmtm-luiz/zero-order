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
  const idMatch = s.match(/<@!?(\d{5,25})>/);
  const flagMatch = s.match(/<\s*(true|false)\s*>/i);
  // remove todos os <...> para obter o nome fallback
  const name = s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  let id: string | null = idMatch ? idMatch[1] : null;
  // Compat: célula com apenas dígitos = ID cru
  if (!id && /^\d{5,25}$/.test(name)) id = name;
  return {
    raw: s,
    id,
    fallbackName: name && !/^\d{5,25}$/.test(name) ? name : "",
    forceFallback: flagMatch ? flagMatch[1].toLowerCase() === "true" : false,
  };
}

const AVATAR_FALLBACK = (id: string) => {
  const n = Number(BigInt(id || "0") % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${n}.png`;
};

export async function fetchDiscordUser(id: string): Promise<DiscordUser> {
  const clean = id.trim();
  const fallback: DiscordUser = {
    id: clean,
    username: clean,
    handle: clean,
    avatarUrl: AVATAR_FALLBACK(clean),
  };
  if (!/^\d{5,25}$/.test(clean)) return fallback;
  // Tenta múltiplas APIs públicas para robustez.
  const endpoints = [
    `https://japi.rest/discord/v1/user/${clean}`,
    `https://discordlookup.mesalytic.moe/v1/user/${clean}`,
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      // japi.rest → { data: { username, global_name, avatarURL } }
      const d = data.data ?? data;
      const username = d.global_name || d.globalName || d.username || null;
      const handle = d.username || d.tag?.split("#")[0] || null;
      const avatar =
        d.avatarURL ||
        d.avatar?.link ||
        (typeof d.avatar === "string" && d.avatar.startsWith("http") ? d.avatar : null);
      if (username || avatar) {
        return {
          id: clean,
          username: username || clean,
          handle: handle || clean,
          avatarUrl: avatar || AVATAR_FALLBACK(clean),
        };
      }
    } catch {
      /* try next */
    }
  }
  return fallback;
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
