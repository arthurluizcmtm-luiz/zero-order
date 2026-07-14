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
  error?: string;
};

export const fetchSheetData = createServerFn({ method: "GET" }).handler(
  async (): Promise<SheetData> => {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`;
    try {
      const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
      if (!res.ok) {
        return {
          crew: [],
          topSA: [],
          error: `Não foi possível ler a planilha (HTTP ${res.status}). Verifique se ela está compartilhada como "Qualquer pessoa com o link".`,
        };
      }
      const text = await res.text();
      // Se o Google devolveu HTML de login, a planilha não é pública.
      if (text.trimStart().startsWith("<")) {
        return {
          crew: [],
          topSA: [],
          error:
            'A planilha ainda está privada. No Google Sheets, clique em "Compartilhar" e escolha "Qualquer pessoa com o link" como Leitor.',
        };
      }
      const rows = parseCSV(text);
      const crew: string[] = [];
      const topSA: string[] = [];
      for (let i = 0; i < Math.min(rows.length, 100); i++) {
        const a = (rows[i][0] ?? "").trim();
        const b = (rows[i][1] ?? "").trim();
        if (a) crew.push(a);
        if (b) topSA.push(b);
      }
      return { crew, topSA };
    } catch (e) {
      return {
        crew: [],
        topSA: [],
        error: e instanceof Error ? e.message : "Erro desconhecido ao buscar a planilha.",
      };
    }
  },
);
