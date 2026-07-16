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

export type SheetData = {
  crew: string[];
  topSA: string[]; // Discord IDs
  skilled: string[];
  mobile: string[];
  pc: string[];
  console: string[];
  faq: FaqItem[];
  news: NewsItem[];
  giveaways: GiveawayItem[];
  regions: string[]; // 60 slots (10 por região) — IDs de Discord
  youtube: string[];
  privateServers: string[]; // coluna L
  discordUrl: string;
  error?: string;
};

const EMPTY: SheetData = {
  crew: [], topSA: [], skilled: [], mobile: [], pc: [], console: [],
  faq: [], news: [], giveaways: [], regions: [], youtube: [], privateServers: [], discordUrl: "",
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
      const filtered: string[][] = [[], [], [], [], [], []]; // A..F
      const rawG: string[] = [];
      const rawH: string[] = [];
      const rawI: string[] = [];
      const rawJ: string[] = new Array(60).fill("");
      const rawK: string[] = [];
      const rawL: string[] = [];
      let discordUrl = "";
      const max = Math.min(rows.length, 500);
      for (let i = 0; i < max; i++) {
        const r = rows[i] ?? [];
        for (let c = 0; c < 6; c++) {
          const v = (r[c] ?? "").trim();
          if (v) filtered[c].push(v);
        }
        rawG.push(r[6] ?? "");
        rawH.push(r[7] ?? "");
        rawI.push(r[8] ?? "");
        if (i < 60) rawJ[i] = (r[9] ?? "").trim();
        const k = (r[10] ?? "").trim();
        if (k) rawK.push(k);
        const l = (r[11] ?? "").trim();
        if (l) rawL.push(l);
        if (i === 0) {
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

      return {
        crew: filtered[0],
        topSA: filtered[1],
        skilled: filtered[2],
        mobile: filtered[3],
        pc: filtered[4],
        console: filtered[5],
        faq: pairs(rawG, (q, a) => ({ question: q, answer: a })),
        news: pairs(rawH, (t, d) => ({ title: t, description: d })),
        giveaways,
        regions: rawJ,
        youtube: rawK,
        privateServers: rawL,
        discordUrl,
      };
    } catch (e) {
      return { ...EMPTY, error: e instanceof Error ? e.message : "Erro desconhecido ao buscar a planilha." };
    }
  },
);
