import { createServerFn } from "@tanstack/react-start";
import { SHEET_ID, SHEET_GID } from "./crew-data";

// Parser CSV mínimo (aspas duplas + vírgulas embutidas).
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") {/* ignore */}
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

export type FaqItem = { question: string; answer: string };
export type NewsItem = { title: string; description: string };
export type GiveawayItem = { prize: string; endsAt: string };
export type WarLogItem = { lines: string[] };
export type WarRecord = { wins: number; losses: number; raw: string };

export type SheetData = {
  crew: string[];
  warRecord: WarRecord | null;
  warLogs: WarLogItem[];
  skilled: string[];
  mobile: string[];
  pc: string[];
  console: string[];
  faq: FaqItem[];
  news: NewsItem[];
  giveaways: GiveawayItem[];
  regions: string[]; // J: 60 slots (10 por região) — geral
  regionsMobile: string[]; // N: 60 slots
  regionsPc: string[]; // O: 60 slots
  regionsConsole: string[]; // P: 60 slots
  youtube: string[];
  privateServers: string[]; // coluna L
  spotifyUrl: string; // M1
  discord: { guildName: string; iconUrl: string | null; memberCount?: number; presenceCount?: number } | null;
  error?: string;
};

const EMPTY: SheetData = {
  crew: [], warRecord: null, warLogs: [], skilled: [], mobile: [], pc: [], console: [],
  faq: [], news: [], giveaways: [], regions: [], regionsMobile: [], regionsPc: [],
  regionsConsole: [], youtube: [], privateServers: [],
  spotifyUrl: "", discord: null,
};



function pairs<T>(col: string[], make: (a: string, b: string) => T): T[] {
  const out: T[] = [];
  for (let i = 0; i < col.length; i += 2) {
    const a = (col[i] ?? "").trim();
    const b = (col[i + 1] ?? "").trim();
    if (!a && !b) continue;
    out.push(make(a, b));
  }
  return out;
}

// Data de hoje no fuso America/Sao_Paulo em YYYY-MM-DD.
function todayBR(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// Converte "DD/MM/YY" ou "DD/MM/YYYY" em "YYYY-MM-DD". Retorna null se inválido.
function parseBRDate(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  let [, d, mo, y] = m;
  if (y.length === 2) y = "20" + y;
  return `${y.padStart(4, "0")}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export const fetchSheetData = createServerFn({ method: "GET" }).handler(
  async (): Promise<SheetData> => {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}&range=A1:Z500`;
    try {
      const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
      if (!res.ok) {
        return { ...EMPTY, error: `Não foi possível ler a planilha (HTTP ${res.status}). Verifique se ela está compartilhada como "Qualquer pessoa com o link".` };
      }
      const text = await res.text();
      if (text.trimStart().startsWith("<")) {
        return { ...EMPTY, error: 'A planilha ainda está privada. No Google Sheets, clique em "Compartilhar" e escolha "Qualquer pessoa com o link" como Leitor.' };
      }
      const rows = parseCSV(text);
      const filtered: string[][] = [[], [], [], [], [], []]; // A, C, D, E, F apenas (B tratada à parte)
      const rawB: string[] = [];
      const rawG: string[] = [];
      const rawH: string[] = [];
      const rawI: string[] = [];
      const rawJ: string[] = new Array(60).fill("");
      const rawN: string[] = new Array(60).fill("");
      const rawO: string[] = new Array(60).fill("");
      const rawP: string[] = new Array(60).fill("");
      const rawK: string[] = [];
      const rawL: string[] = [];
      let discordUrl = "";
      let spotifyUrl = "";
      const max = Math.min(rows.length, 500);
      for (let i = 0; i < max; i++) {
        const r = rows[i] ?? [];
        // Colunas A, C-F (índices 0, 2, 3, 4, 5) — remove vazios.
        const colMap = [0, 2, 3, 4, 5];
        colMap.forEach((c, idx) => {
          const v = (r[c] ?? "").trim();
          if (v) filtered[idx].push(v);
        });
        rawB.push((r[1] ?? "").trim());
        rawG.push(r[6] ?? "");
        rawH.push(r[7] ?? "");
        rawI.push(r[8] ?? "");
        if (i < 60) {
          rawJ[i] = (r[9] ?? "").trim();
          rawN[i] = (r[13] ?? "").trim();
          rawO[i] = (r[14] ?? "").trim();
          rawP[i] = (r[15] ?? "").trim();
        }

        const k = (r[10] ?? "").trim();
        if (k) rawK.push(k);
        const l = (r[11] ?? "").trim();
        if (l) rawL.push(l);
        if (i === 0) {
          const m = (r[12] ?? "").trim();
          if (m) spotifyUrl = m;
          const z = (r[25] ?? "").trim();
          if (z) discordUrl = z;
        }
      }

      // Filtrar sorteios expirados (data no fuso do Brasil).
      const today = todayBR();
      const giveaways = pairs(rawI, (p, d) => ({ prize: p, endsAt: d })).filter((g) => {
        const iso = parseBRDate(g.endsAt);
        if (!iso) return true; // sem data reconhecível: mantém
        return iso >= today;
      });

      // Coluna B: B1 = placar geral "wins/losses", B2+ = cada célula é um WarLog
      // com "." separando linhas.
      let warRecord: WarRecord | null = null;
      const b1 = rawB[0] ?? "";
      const rec = b1.match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
      if (rec) warRecord = { wins: Number(rec[1]), losses: Number(rec[2]), raw: b1 };
      else if (b1) warRecord = { wins: 0, losses: 0, raw: b1 };

      const warLogs: WarLogItem[] = rawB
        .slice(1)
        .filter((v) => v.trim().length > 0)
        .map((v) => ({
          lines: v
            .split(/\.\s*/)
            .map((s) => s.trim())
            .filter(Boolean),
        }));

      return {
        crew: filtered[0],
        warRecord,
        warLogs,
        skilled: filtered[1],
        mobile: filtered[2],
        pc: filtered[3],
        console: filtered[4],
        faq: pairs(rawG, (q, a) => ({ question: q, answer: a })),
        news: pairs(rawH, (t, d) => ({ title: t, description: d })),
        giveaways,
        regions: rawJ,
        regionsMobile: rawN,
        regionsPc: rawO,
        regionsConsole: rawP,

        youtube: rawK,
        privateServers: rawL,
        spotifyUrl,
        discordUrl,
      };

    } catch (e) {
      return { ...EMPTY, error: e instanceof Error ? e.message : "Erro desconhecido ao buscar a planilha." };
    }
  },
);
