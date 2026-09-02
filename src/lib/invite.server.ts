// Server-only: o link de convite do Discord nunca é enviado ao navegador.
import { SHEET_ID, SHEET_GID } from "./crew-data";

const FALLBACK_INVITE = "https://discord.gg/atMHkzPrKA";

export type DiscordServerInfo = {
  guildName: string;
  iconUrl: string | null;
  memberCount?: number;
  presenceCount?: number;
};

let cached: { url: string; at: number } | null = null;

// Lê a célula Z1 da planilha (link oficial) com cache de 5 min.
export async function resolveInviteUrl(): Promise<string> {
  if (cached && Date.now() - cached.at < 5 * 60_000) return cached.url;
  let url = FALLBACK_INVITE;
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}&range=Z1:Z1`;
    const res = await fetch(csvUrl, { headers: { "cache-control": "no-cache" } });
    if (res.ok) {
      const text = (await res.text()).trim().replace(/^"|"$/g, "").trim();
      if (/discord\.(gg|com)\//.test(text)) url = text;
    }
  } catch {
    /* mantém fallback */
  }
  cached = { url, at: Date.now() };
  return url;
}

export function inviteCode(input: string): string | null {
  const m = input.match(/(?:discord\.gg\/|discord\.com\/invite\/)([A-Za-z0-9-]+)/);
  return m ? m[1] : null;
}

// Metadados públicos do servidor (nome, ícone, contagem) — sem expor o convite.
export async function fetchInviteInfo(): Promise<DiscordServerInfo | null> {
  const code = inviteCode(await resolveInviteUrl());
  if (!code) return null;
  try {
    const res = await fetch(`https://discord.com/api/v10/invites/${code}?with_counts=true`);
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const guild = data?.guild;
    if (!guild) return null;
    return {
      guildName: guild.name,
      iconUrl: guild.icon
        ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith("a_") ? "gif" : "png"}?size=256`
        : null,
      memberCount: data.approximate_member_count,
      presenceCount: data.approximate_presence_count,
    };
  } catch {
    return null;
  }
}
