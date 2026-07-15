// Utilitários client-side para buscar dados públicos do Discord.

export type DiscordUser = {
  id: string;
  username: string;
  avatarUrl: string;
};

export type DiscordInviteInfo = {
  guildId: string;
  guildName: string;
  iconUrl: string | null;
  memberCount?: number;
  presenceCount?: number;
};

const AVATAR_FALLBACK = (id: string) => {
  // Avatar default do Discord (0..5) baseado no ID.
  const n = Number(BigInt(id || "0") % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${n}.png`;
};

export async function fetchDiscordUser(id: string): Promise<DiscordUser> {
  const clean = id.trim();
  const fallback: DiscordUser = {
    id: clean,
    username: clean,
    avatarUrl: AVATAR_FALLBACK(clean),
  };
  if (!/^\d{5,25}$/.test(clean)) return fallback;
  try {
    const res = await fetch(`https://discordlookup.mesalytic.moe/v1/user/${clean}`);
    if (!res.ok) return fallback;
    const data = await res.json();
    return {
      id: clean,
      username: data.global_name || data.username || clean,
      avatarUrl: data.avatar?.link || AVATAR_FALLBACK(clean),
    };
  } catch {
    return fallback;
  }
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
