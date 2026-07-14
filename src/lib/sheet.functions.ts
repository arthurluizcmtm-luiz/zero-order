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

export type SheetData = {
  crew: string[];
  topSA: string[];
  skilled: string[];
  mobile: string[];
  pc: string[];
  console: string[];
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
  discordUrl: "",
};

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
      const cols: string[][] = [[], [], [], [], [], []]; // A..F
      let discordUrl = "";
      for (let i = 0; i < Math.min(rows.length, 100); i++) {
        for (let c = 0; c < 6; c++) {
          const v = (rows[i][c] ?? "").trim();
          if (v) cols[c].push(v);
        }
        if (i === 0) {
          // Z1 = coluna index 25
          const z = (rows[0][25] ?? "").trim();
          if (z) discordUrl = z;
        }
      }
      return {
        crew: cols[0],
        topSA: cols[1],
        skilled: cols[2],
        mobile: cols[3],
        pc: cols[4],
        console: cols[5],
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
