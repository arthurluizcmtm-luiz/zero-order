// Núcleo do bot do Discord — só roda no servidor.
// Credenciais ficam no cofre de segredos (env): DISCORD_BOT_TOKEN,
// DISCORD_PUBLIC_KEY, DISCORD_APPLICATION_ID, DISCORD_ROLE_ID e
// OPENROUTER_API_KEY. A planilha guarda só textos editáveis:
//   Q5 = resposta sobre "como virar staff"
import { SHEET_ID } from "./crew-data";

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";
const DEFAULT_ADMIN_ROLE = "1542326621745447063";

export type BotConfig = {
  token: string;
  publicKey: string;
  appId: string;
  aiKey: string;
  staffAnswer: string;
  adminRoleId: string;
};

function gatewayHeaders(): Record<string, string> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !connKey) {
    throw new Error("Conector do Google Sheets não configurado no projeto.");
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connKey,
    "Content-Type": "application/json",
  };
}

export async function readRange(range: string): Promise<string[][]> {
  const res = await fetch(
    `${GATEWAY}/spreadsheets/${SHEET_ID}/values/${range}?majorDimension=ROWS`,
    { headers: gatewayHeaders() },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao ler ${range} [${res.status}]: ${body}`);
  }
  const json = (await res.json()) as { values?: string[][] };
  return json.values ?? [];
}

export async function readColumn(range: string, size: number): Promise<string[]> {
  const rows = await readRange(range);
  const out = new Array<string>(size).fill("");
  rows.forEach((r, i) => {
    if (i < size) out[i] = (r?.[0] ?? "").trim();
  });
  return out;
}

export async function writeColumn(range: string, values: string[]): Promise<void> {
  const res = await fetch(
    `${GATEWAY}/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: gatewayHeaders(),
      body: JSON.stringify({
        range,
        majorDimension: "ROWS",
        values: values.map((v) => [v]),
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao escrever em ${range} [${res.status}]: ${body}`);
  }
}

let cachedConfig: { at: number; value: BotConfig } | null = null;

export async function getBotConfig(force = false): Promise<BotConfig> {
  if (!force && cachedConfig && Date.now() - cachedConfig.at < 30_000) {
    return cachedConfig.value;
  }
  // Credenciais vêm do cofre de segredos — nunca da planilha pública.
  const token = process.env["DISCORD_BOT_TOKEN"] ?? "";
  const publicKey = process.env["DISCORD_PUBLIC_KEY"] ?? "";
  const appId = process.env["DISCORD_APPLICATION_ID"] ?? "";
  const aiKey = process.env["OPENROUTER_API_KEY"] ?? "";
  const adminRoleId = process.env["DISCORD_ROLE_ID"] || DEFAULT_ADMIN_ROLE;

  // Único dado que continua editável pela planilha: a resposta de staff (Q5).
  let staffAnswer = "";
  try {
    const rows = await readRange("Q5");
    staffAnswer = (rows[0]?.[0] ?? "").trim();
  } catch {
    staffAnswer = "";
  }

  const value: BotConfig = { token, publicKey, appId, aiKey, staffAnswer, adminRoleId };
  cachedConfig = { at: Date.now(), value };
  return value;
}

// ---------- verificação de assinatura Ed25519 ----------

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function verifyDiscordSignature(
  publicKeyHex: string,
  signatureHex: string,
  timestamp: string,
  body: string,
): Promise<boolean> {
  if (!publicKeyHex || !signatureHex || !timestamp) return false;
  const data = new TextEncoder().encode(timestamp + body);
  const sig = hexToBytes(signatureHex);
  const pub = hexToBytes(publicKeyHex);
  for (const algo of ["Ed25519", "NODE-ED25519"]) {
    try {
      const key = await crypto.subtle.importKey(
        "raw",
        pub as unknown as BufferSource,
        { name: algo, namedCurve: "Ed25519" } as unknown as AlgorithmIdentifier,
        false,
        ["verify"],
      );
      return await crypto.subtle.verify(
        { name: algo } as unknown as AlgorithmIdentifier,
        key,
        sig as unknown as BufferSource,
        data as unknown as BufferSource,
      );
    } catch {
      // tenta o próximo nome de algoritmo
    }
  }
  return false;
}

// ---------- utilitários de ranking ----------

export const REGION_OFFSET: Record<string, number> = {
  sa: 0,
  na: 10,
  eu: 20,
  asia: 30,
  africa: 40,
  oceania: 50,
};

export const REGION_LABEL: Record<string, string> = {
  sa: "South America",
  na: "North America",
  eu: "Europe",
  asia: "Asia",
  africa: "Africa",
  oceania: "Oceania",
};

export const CATEGORY_COLUMN: Record<string, string> = {
  geral: "J",
  mobile: "N",
  pc: "O",
  console: "P",
};

// Aceita apelidos/escritas diferentes para região (evita cair sempre no S.A).
const REGION_ALIASES: Record<string, string> = {
  sa: "sa", "s.a": "sa", "s.a.": "sa", southamerica: "sa", "south america": "sa",
  america_do_sul: "sa", "america do sul": "sa", br: "sa", brasil: "sa", latam: "sa",
  na: "na", "n.a": "na", "n.a.": "na", northamerica: "na", "north america": "na",
  "america do norte": "na", us: "na", usa: "na",
  eu: "eu", europe: "eu", europa: "eu",
  asia: "asia", "ásia": "asia", as: "asia",
  africa: "africa", "áfrica": "africa", af: "africa",
  oceania: "oceania", oce: "oceania", oc: "oceania", au: "oceania", australia: "oceania",
};

export function normalizeRegion(raw: string): string | null {
  const k = (raw ?? "").trim().toLowerCase();
  if (!k) return null;
  const direct = REGION_ALIASES[k];
  if (direct) return direct;
  const compactKey = k.replace(/[^a-z]/g, "");
  return REGION_ALIASES[compactKey] ?? null;
}

const CATEGORY_ALIASES: Record<string, string> = {
  geral: "geral", general: "geral", global: "geral", all: "geral", todos: "geral",
  mobile: "mobile", cel: "mobile", celular: "mobile", mob: "mobile",
  pc: "pc", computador: "pc", desktop: "pc",
  console: "console", xbox: "console", ps: "console", playstation: "console",
};

export function normalizeCategory(raw: string): string | null {
  const k = (raw ?? "").trim().toLowerCase();
  if (!k) return "geral";
  return CATEGORY_ALIASES[k.replace(/[^a-z]/g, "")] ?? null;
}


// Extrai o ID de Discord de uma célula no formato "<@123> Nome <True>".
export function cellId(cell: string): string | null {
  const m = (cell ?? "").match(/<@?!?(\d{5,25})>/);
  if (m) return m[1] ?? null;
  const raw = (cell ?? "").trim();
  return /^\d{5,25}$/.test(raw) ? raw : null;
}

export function formatEntry(id: string, name?: string): string {
  const n = (name ?? "").trim();
  return n ? `<@${id}> ${n} <False>` : `<@${id}>`;
}

// Lista compacta (sem buracos) a partir de uma coluna.
export function compact(list: string[]): string[] {
  return list.map((v) => (v ?? "").trim()).filter((v) => v.length > 0);
}

// Insere respeitando o "sobe/desce" de quem já estava na posição.
// sobeAntigo = true  -> quem estava permanece acima (novo entra logo abaixo)
// sobeAntigo = false -> quem estava desce (novo assume a posição)
export function insertAt(
  list: string[],
  entry: string,
  position: number,
  sobeAntigo: boolean,
  matches: (cell: string) => boolean,
): string[] {
  const items = compact(list).filter((c) => !matches(c));
  const pos = Math.max(1, Math.min(position, items.length + 1));
  const occupied = items.length >= pos;
  const index = occupied && sobeAntigo ? pos : pos - 1;
  items.splice(Math.min(index, items.length), 0, entry);
  return items;
}

export function padTo(list: string[], size: number): string[] {
  const out = list.slice(0, size);
  while (out.length < size) out.push("");
  return out;
}

// ---------- IA (OpenRouter) ----------

export async function askAI(
  apiKey: string,
  question: string,
  context: { staffAnswer: string; faq: string },
): Promise<string> {
  if (!apiKey) {
    return "A IA ainda não está configurada no servidor. Avise a staff.";
  }
  const system = [
    "Você é o assistente oficial da crew Zero Order (Blox Fruits).",
    "Responda SEMPRE no mesmo idioma da pergunta do usuário, de forma curta e direta (máximo 6 linhas).",
    "Fatos oficiais:",
    "- A crew foi fundada em 14/07/26 e quer dominar todos os servidores possíveis.",
    "- Para entrar em um TOP de uma região, é preciso vencer alguém que já está no top da sua própria região.",
    "- As entradas na crew ainda estão em desenvolvimento; a abertura está prevista para agosto ou antes, com avisos no Discord.",
    `- Como virar staff: ${context.staffAnswer || "as vagas de staff ainda não estão abertas; acompanhe os avisos no Discord."}`,
    context.faq ? `FAQ do site:\n${context.faq}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        max_tokens: 300,
        messages: [
          { role: "system", content: system },
          { role: "user", content: question },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`OpenRouter falhou [${res.status}]: ${body}`);
      return "Não consegui falar com a IA agora. Tente de novo em instantes.";
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    return text && text.length > 0
      ? text
      : "Não consegui gerar uma resposta para isso.";
  } catch (e) {
    console.error(e);
    return "Não consegui falar com a IA agora. Tente de novo em instantes.";
  }
}
