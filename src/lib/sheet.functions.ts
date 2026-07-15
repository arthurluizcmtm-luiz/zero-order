import { createServerFn } from "@tanstack/react-start";
import { SHEET_ID, SHEET_GID } from "./crew-data";

// Parse simples de CSV (suporta aspas duplas e vírgulas dentro de campos).
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c === "\r") {
        // ignora
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export type FaqItem = { question: string; answer: string };
export type NewsItem = { title: string; description: string };
export type GiveawayItem = { prize: string; endsAt: string };

export type SheetData = {
  crew: string[];
  topSA: string[];
  skilled: string[];
  mobile: string[];
  pc: string[];
  console: string[];
  faq: FaqItem[];
  news: NewsItem[];
  giveaways: GiveawayItem[];
  discordUrl: string;
  error?: string;
};

const EMPTY: SheetData = {
  crew: [],
  topSA: [],
  skilled: [],
  mobile: [],
  pc: [],
  console: [],
  faq: [],
  news: [],
  giveaways: [],
  discordUrl: "",
};

// Agrupa uma coluna em pares (linha ímpar = título/prêmio, par = descrição/data).
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

export const fetchSheetData = createServerFn({ method: "GET" }).handler(
  async (): Promise<SheetData> => {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}&range=A1:Z100`;
    try {
      const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
      if (!res.ok) {
        return {
          ...EMPTY,
          error: `Não foi possível ler a planilha (HTTP ${res.status}). Verifique se ela está compartilhada como "Qualquer pessoa com o link".`,
        };
      }
      const text = await res.text();
      if (text.trimStart().startsWith("<")) {
        return {
          ...EMPTY,
          error:
            'A planilha ainda está privada. No Google Sheets, clique em "Compartilhar" e escolha "Qualquer pessoa com o link" como Leitor.',
        };
      }
      const rows = parseCSV(text);
      // A..I  (0..8) — mantemos células vazias para preservar o pareamento em G/H/I.
      const filtered: string[][] = [[], [], [], [], [], []]; // A..F sem vazios
      const rawG: string[] = [];
      const rawH: string[] = [];
      const rawI: string[] = [];
      let discordUrl = "";
      for (let i = 0; i < Math.min(rows.length, 100); i++) {
        for (let c = 0; c < 6; c++) {
          const v = (rows[i][c] ?? "").trim();
          if (v) filtered[c].push(v);
        }
        rawG.push(rows[i][6] ?? "");
        rawH.push(rows[i][7] ?? "");
        rawI.push(rows[i][8] ?? "");
        if (i === 0) {
          const z = (rows[0][25] ?? "").trim();
          if (z) discordUrl = z;
        }
      }
      return {
        crew: filtered[0],
        topSA: filtered[1],
        skilled: filtered[2],
        mobile: filtered[3],
        pc: filtered[4],
        console: filtered[5],
        faq: pairs(rawG, (q, a) => ({ question: q, answer: a })),
        news: pairs(rawH, (t, d) => ({ title: t, description: d })),
        giveaways: pairs(rawI, (p, d) => ({ prize: p, endsAt: d })),
        discordUrl,
      };
    } catch (e) {
      return {
        ...EMPTY,
        error: e instanceof Error ? e.message : "Erro desconhecido ao buscar a planilha.",
      };
    }
  },
);

