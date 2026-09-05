import { createFileRoute } from "@tanstack/react-router";
import { fetchSheetData } from "@/lib/sheet.functions";

// Endpoint público (GET) que devolve todos os dados do site em JSON limpo.
// Qualquer bot/script pode ler sem token:
//   GET https://zero-order.lovable.app/api/public/data
//
// Retorna o mesmo objeto que o site usa internamente (SheetData):
// crew, skilled, mobile, pc, console, faq, news, giveaways,
// regions (geral/mobile/pc/console), youtube, privateServers, discord.
export const Route = createFileRoute("/api/public/data")({
  server: {
    handlers: {
      GET: async () => {
        const data = await fetchSheetData({ data: undefined });
        return Response.json(data, {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=30, s-maxage=30",
          },
        });
      },
    },
  },
});
