// Ponte usada pelo bot Gateway externo: ele autentica com o próprio token do
// bot (header x-bot-token) e pede uma ação; toda a lógica da planilha fica aqui.
import { createFileRoute } from "@tanstack/react-router";

import {
  actionPerguntar,
  actionRemoveTop,
  actionRemoveTopCrew,
  actionTop,
  actionTopCrew,
  actionTopRanking,
  actionTopVideos,
} from "@/lib/discord-actions.server";
import { getBotConfig } from "@/lib/discord-bot.server";

type Body = {
  action?: string;
  regiao?: string;
  categoria?: string;
  usuario?: string;
  nome?: string;
  link?: string;
  pergunta?: string;
  posicao?: number;
  sobe?: boolean;
};

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/bot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const noStore = { "cache-control": "no-store" } as const;
        let config;
        try {
          config = await getBotConfig();
        } catch (e) {
          console.error(e);
          return Response.json(
            { content: "Configuração do bot indisponível." },
            { status: 500, headers: noStore },
          );
        }

        const sent = request.headers.get("x-bot-token") ?? "";
        if (!config.token || !safeEqual(sent, config.token)) {
          return Response.json(
            { content: "unauthorized" },
            { status: 401, headers: noStore },
          );
        }

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json(
            { content: "JSON inválido." },
            { status: 400, headers: noStore },
          );
        }

        try {
          const posicao = Number(body.posicao ?? 0);
          const sobe = body.sobe === true;
          let content: string;
          switch (body.action) {
            case "top":
              content = await actionTop(
                body.regiao ?? "",
                body.categoria ?? "",
                body.usuario ?? "",
                posicao,
              );
              break;
            case "removetop":
              content = await actionRemoveTop(
                body.regiao ?? "",
                body.categoria ?? "",
                body.usuario ?? "",
              );
              break;
            case "topcrew":
              content = await actionTopCrew(body.usuario ?? "", posicao, sobe);
              break;
            case "removetopcrew":
              content = await actionRemoveTopCrew(body.usuario ?? "");
              break;
            case "topranking":
              content = await actionTopRanking(body.nome ?? "", posicao, sobe);
              break;
            case "topvideos":
              content = await actionTopVideos(body.link ?? "");
              break;
            case "perguntar":
              content = await actionPerguntar(
                body.pergunta ?? "",
                config.aiKey,
                config.staffAnswer,
              );
              break;
            default:
              content = "Ação desconhecida.";
          }
          return Response.json(
            { content, adminRoleId: config.adminRoleId },
            { headers: { "cache-control": "no-store" } },
          );
        } catch (e) {
          console.error(e);
          const msg = e instanceof Error ? e.message : "erro desconhecido";
          return Response.json({ content: `⚠️ Não consegui concluir: ${msg}` });
        }
      },
    },
  },
});
