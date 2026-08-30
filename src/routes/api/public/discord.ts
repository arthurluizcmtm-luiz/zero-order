import { createFileRoute } from "@tanstack/react-router";

import {
  CATEGORY_COLUMN,
  REGION_LABEL,
  REGION_OFFSET,
  askAI,
  cellId,
  compact,
  formatEntry,
  getBotConfig,
  insertAt,
  padTo,
  readColumn,
  readRange,
  verifyDiscordSignature,
  writeColumn,
} from "@/lib/discord-bot.server";

type Option = { name: string; value?: unknown; options?: Option[] };

type Interaction = {
  type: number;
  data?: { name?: string; options?: Option[] };
  member?: { roles?: string[]; user?: { id?: string } };
  user?: { id?: string };
};

const EPHEMERAL = 64;

function reply(content: string, ephemeral = true) {
  return Response.json({
    type: 4,
    data: { content, flags: ephemeral ? EPHEMERAL : 0 },
  });
}

function opt(options: Option[] | undefined, name: string): string {
  const found = options?.find((o) => o.name === name);
  return found?.value === undefined ? "" : String(found.value);
}

function optBool(options: Option[] | undefined, name: string): boolean {
  const found = options?.find((o) => o.name === name);
  return found?.value === true || String(found?.value).toLowerCase() === "true";
}

function parseId(raw: string): string | null {
  const m = raw.match(/(\d{5,25})/);
  return m ? (m[1] ?? null) : null;
}

async function handleTop(options: Option[] | undefined): Promise<Response> {
  const region = normalizeRegion(opt(options, "regiao"));
  const categoria = normalizeCategory(opt(options, "categoria"));
  const id = parseId(opt(options, "usuario"));
  const posicao = Number(opt(options, "posicao"));

  if (!region) return reply("Região inválida (use sa, na, eu, asia, africa ou oceania).");
  if (!categoria) return reply("Categoria inválida (use geral, mobile, pc ou console).");
  const offset = REGION_OFFSET[region] ?? 0;
  const column = CATEGORY_COLUMN[categoria] ?? "J";
  if (!id) return reply("ID de Discord inválido.");
  if (!Number.isInteger(posicao) || posicao < 1 || posicao > 10) {
    return reply("A posição precisa ser um número de 1 a 10.");
  }

  const range = `${column}${offset + 1}:${column}${offset + 10}`;
  const block = await readColumn(range, 10);
  const items = compact(block).filter((c) => cellId(c) !== id);
  items.splice(Math.min(posicao - 1, items.length), 0, formatEntry(id));
  await writeColumn(range, padTo(items, 10));

  return reply(
    `✅ <@${id}> agora é **#${posicao}** no top **${REGION_LABEL[region]}** (${categoria}) · células \`${range}\`.`,
  );
}

async function handleRemoveTop(options: Option[] | undefined): Promise<Response> {
  const region = normalizeRegion(opt(options, "regiao"));
  const categoria = normalizeCategory(opt(options, "categoria"));
  const id = parseId(opt(options, "usuario"));
  if (!region) return reply("Região inválida (use sa, na, eu, asia, africa ou oceania).");
  if (!categoria) return reply("Categoria inválida (use geral, mobile, pc ou console).");
  if (!id) return reply("ID de Discord inválido.");

  const offset = REGION_OFFSET[region] ?? 0;
  const column = CATEGORY_COLUMN[categoria] ?? "J";
  const range = `${column}${offset + 1}:${column}${offset + 10}`;
  const block = await readColumn(range, 10);
  const items = compact(block);
  const next = items.filter((c) => cellId(c) !== id);
  if (next.length === items.length) {
    return reply(`Não achei <@${id}> em **${REGION_LABEL[region]}** (${categoria}).`);
  }
  await writeColumn(range, padTo(next, 10));
  return reply(
    `🗑️ <@${id}> removido de **${REGION_LABEL[region]}** (${categoria}) · células \`${range}\`.`,
  );
}

async function handleRemoveTopCrew(options: Option[] | undefined): Promise<Response> {
  const id = parseId(opt(options, "usuario"));
  if (!id) return reply("ID de Discord inválido.");
  const list = await readColumn("A1:A100", 100);
  const items = compact(list);
  const next = items.filter((c) => cellId(c) !== id);
  if (next.length === items.length) {
    return reply(`Não achei <@${id}> nos Melhores da Crew.`);
  }
  await writeColumn("A1:A100", padTo(next, 100));
  return reply(`🗑️ <@${id}> removido dos Melhores da Crew.`);
}


async function handleTopCrew(options: Option[] | undefined): Promise<Response> {
  const id = parseId(opt(options, "usuario"));
  const posicao = Number(opt(options, "posicao"));
  const sobe = optBool(options, "sobe");
  if (!id) return reply("ID de Discord inválido.");
  if (!Number.isInteger(posicao) || posicao < 1 || posicao > 100) {
    return reply("A posição precisa ser um número de 1 a 100.");
  }

  const list = await readColumn("A1:A100", 100);
  const next = insertAt(
    list,
    formatEntry(id),
    posicao,
    sobe,
    (cell) => cellId(cell) === id,
  );
  await writeColumn("A1:A100", padTo(next, 100));

  const finalPos = next.findIndex((c) => cellId(c) === id) + 1;
  return reply(
    `✅ <@${id}> entrou nos Melhores da Crew na posição **#${finalPos}**` +
      (sobe ? " (quem estava ali subiu)." : " (quem estava ali desceu)."),
  );
}

async function handleTopRanking(options: Option[] | undefined): Promise<Response> {
  const nome = opt(options, "nome").trim();
  const posicao = Number(opt(options, "posicao"));
  const sobe = optBool(options, "sobe");
  if (!nome) return reply("Informe o nome de quem entra.");
  if (!Number.isInteger(posicao) || posicao < 1 || posicao > 100) {
    return reply("A posição precisa ser um número de 1 a 100.");
  }

  const id = parseId(nome);
  const entry = id ? formatEntry(id) : nome;
  const list = await readColumn("C1:C100", 100);
  const next = insertAt(list, entry, posicao, sobe, (cell) =>
    id
      ? cellId(cell) === id
      : cell.replace(/<[^>]*>/g, "").trim().toLowerCase() === nome.toLowerCase(),
  );
  await writeColumn("C1:C100", padTo(next, 100));

  const finalPos = next.indexOf(entry) + 1;
  return reply(`✅ **${nome}** entrou no ranking na posição **#${finalPos}**.`);
}

async function handleTopVideos(options: Option[] | undefined): Promise<Response> {
  const link = opt(options, "link").trim();
  if (!/^https?:\/\//i.test(link)) return reply("Envie um link válido do vídeo.");

  const list = await readColumn("K1:K200", 200);
  const items = compact(list);
  if (items.some((v) => v === link)) return reply("Esse vídeo já está no placar.");
  items.push(link);
  await writeColumn("K1:K200", padTo(items, 200));

  return reply(`✅ Vídeo adicionado ao placar (#${items.length}).`);
}

async function handlePerguntar(
  options: Option[] | undefined,
  aiKey: string,
  staffAnswer: string,
): Promise<Response> {
  const pergunta = opt(options, "pergunta").trim();
  if (!pergunta) return reply("Escreva sua pergunta.");

  let faq = "";
  try {
    const rows = await readRange("G1:G60");
    faq = rows
      .map((r) => (r?.[0] ?? "").trim())
      .filter(Boolean)
      .join("\n");
  } catch {
    faq = "";
  }

  const answer = await askAI(aiKey, pergunta, { staffAnswer, faq });
  return Response.json({
    type: 4,
    data: { content: `**${pergunta}**\n\n${answer}` },
  });
}

export const Route = createFileRoute("/api/public/discord")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        let config;
        try {
          config = await getBotConfig();
        } catch (e) {
          console.error(e);
          return new Response("config error", { status: 500 });
        }

        const valid = await verifyDiscordSignature(
          config.publicKey,
          request.headers.get("x-signature-ed25519") ?? "",
          request.headers.get("x-signature-timestamp") ?? "",
          body,
        );
        if (!valid) return new Response("invalid request signature", { status: 401 });

        let interaction: Interaction;
        try {
          interaction = JSON.parse(body) as Interaction;
        } catch {
          return new Response("bad json", { status: 400 });
        }

        if (interaction.type === 1) return Response.json({ type: 1 });
        if (interaction.type !== 2) return Response.json({ type: 4, data: { content: "…" } });

        const name = interaction.data?.name ?? "";
        const options = interaction.data?.options;

        try {
          if (name === "perguntar") {
            return await handlePerguntar(options, config.aiKey, config.staffAnswer);
          }

          const roles = interaction.member?.roles ?? [];
          if (!roles.includes(config.adminRoleId)) {
            return reply("❌ Você não tem permissão para usar este comando.");
          }

          switch (name) {
            case "top":
              return await handleTop(options);
            case "topcrew":
              return await handleTopCrew(options);
            case "topranking":
              return await handleTopRanking(options);
            case "topvideos":
              return await handleTopVideos(options);
            default:
              return reply("Comando desconhecido.");
          }
        } catch (e) {
          console.error(e);
          const msg = e instanceof Error ? e.message : "erro desconhecido";
          return reply(`⚠️ Não consegui concluir: ${msg}`);
        }
      },
    },
  },
});
