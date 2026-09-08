// Ações do bot (leitura/escrita na planilha), compartilhadas entre o endpoint
// de Interactions e o bot Gateway externo.
import {
  REGION_LABEL,
  askAI,
  cellId,
  compact,
  formatEntry,
  insertAt,
  normalizeCategory,
  normalizeRegion,
  padTo,
  readColumn,
  readRange,
  regionRange,
} from "./discord-bot.server";

import { writeColumn } from "./discord-bot.server";

export function parseId(raw: string): string | null {
  const m = (raw ?? "").match(/(\d{5,25})/);
  return m ? (m[1] ?? null) : null;
}

export async function actionTop(
  regiao: string,
  categoria: string,
  usuario: string,
  posicao: number,
): Promise<string> {
  const region = normalizeRegion(regiao);
  const cat = normalizeCategory(categoria);
  const id = parseId(usuario);
  if (!region) return "Região inválida (use sa, na, eu, asia, africa ou oceania).";
  if (!cat) return "Categoria inválida (use geral, mobile, pc ou console).";
  if (!id) return "ID de Discord inválido.";
  if (!Number.isInteger(posicao) || posicao < 1 || posicao > 10) {
    return "A posição precisa ser um número de 1 a 10.";
  }
  const range = regionRange(region, cat);
  const block = await readColumn(range, 10);
  const items = compact(block).filter((c) => cellId(c) !== id);
  items.splice(Math.min(posicao - 1, items.length), 0, formatEntry(id));
  await writeColumn(range, padTo(items.slice(0, 10), 10));
  return `✅ <@${id}> agora é **#${posicao}** no top **${REGION_LABEL[region]}** (${cat}) · células \`${range}\`.`;

}

export async function actionRemoveTop(
  regiao: string,
  categoria: string,
  usuario: string,
): Promise<string> {
  const region = normalizeRegion(regiao);
  const cat = normalizeCategory(categoria);
  const id = parseId(usuario);
  if (!region) return "Região inválida (use sa, na, eu, asia, africa ou oceania).";
  if (!cat) return "Categoria inválida (use geral, mobile, pc ou console).";
  if (!id) return "ID de Discord inválido.";
  const range = regionRange(region, cat);
  const block = await readColumn(range, 10);
  const items = compact(block);
  const next = items.filter((c) => cellId(c) !== id);
  if (next.length === items.length) {
    return `Não achei <@${id}> em **${REGION_LABEL[region]}** (${cat}) · células \`${range}\`.`;
  }
  await writeColumn(range, padTo(next.slice(0, 10), 10));
  return `🗑️ <@${id}> removido de **${REGION_LABEL[region]}** (${cat}) · células \`${range}\`.`;

}

export async function actionTopCrew(
  usuario: string,
  posicao: number,
  sobe: boolean,
): Promise<string> {
  const id = parseId(usuario);
  if (!id) return "ID de Discord inválido.";
  if (!Number.isInteger(posicao) || posicao < 1 || posicao > 100) {
    return "A posição precisa ser um número de 1 a 100.";
  }
  const list = await readColumn("A1:A100", 100);
  const next = insertAt(list, formatEntry(id), posicao, sobe, (cell) => cellId(cell) === id);
  await writeColumn("A1:A100", padTo(next, 100));
  const finalPos = next.findIndex((c) => cellId(c) === id) + 1;
  return (
    `✅ <@${id}> entrou nos Melhores da Crew na posição **#${finalPos}**` +
    (sobe ? " (quem estava ali subiu)." : " (quem estava ali desceu).")
  );
}

export async function actionRemoveTopCrew(usuario: string): Promise<string> {
  const id = parseId(usuario);
  if (!id) return "ID de Discord inválido.";
  const list = await readColumn("A1:A100", 100);
  const items = compact(list);
  const next = items.filter((c) => cellId(c) !== id);
  if (next.length === items.length) return `Não achei <@${id}> nos Melhores da Crew.`;
  await writeColumn("A1:A100", padTo(next, 100));
  return `🗑️ <@${id}> removido dos Melhores da Crew.`;
}

export async function actionTopRanking(
  nome: string,
  posicao: number,
  sobe: boolean,
): Promise<string> {
  const nick = (nome ?? "").trim();
  if (!nick) return "Informe o nome de quem entra.";
  if (!Number.isInteger(posicao) || posicao < 1 || posicao > 100) {
    return "A posição precisa ser um número de 1 a 100.";
  }
  const id = parseId(nick);
  const entry = id ? formatEntry(id) : nick;
  const list = await readColumn("C1:C100", 100);
  const next = insertAt(list, entry, posicao, sobe, (cell) =>
    id
      ? cellId(cell) === id
      : cell.replace(/<[^>]*>/g, "").trim().toLowerCase() === nick.toLowerCase(),
  );
  await writeColumn("C1:C100", padTo(next, 100));
  const finalPos = next.indexOf(entry) + 1;
  return `✅ **${nick}** entrou no ranking na posição **#${finalPos}**.`;
}

export async function actionTopVideos(link: string): Promise<string> {
  const url = (link ?? "").trim();
  if (!/^https?:\/\//i.test(url)) return "Envie um link válido do vídeo.";
  const list = await readColumn("K1:K200", 200);
  const items = compact(list);
  if (items.some((v) => v === url)) return "Esse vídeo já está no placar.";
  items.push(url);
  await writeColumn("K1:K200", padTo(items, 200));
  return `✅ Vídeo adicionado ao placar (#${items.length}).`;
}

export async function actionPerguntar(
  pergunta: string,
  aiKey: string,
  staffAnswer: string,
): Promise<string> {
  const q = (pergunta ?? "").trim();
  if (!q) return "Escreva sua pergunta.";
  let faq = "";
  try {
    const rows = await readRange("G1:G60");
    faq = rows.map((r) => (r?.[0] ?? "").trim()).filter(Boolean).join("\n");
  } catch {
    faq = "";
  }
  const answer = await askAI(aiKey, q, { staffAnswer, faq });
  return `**${q}**\n\n${answer}`;
}
