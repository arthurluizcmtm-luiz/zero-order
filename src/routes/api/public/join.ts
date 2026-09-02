import { createFileRoute } from "@tanstack/react-router";

// Redireciona para o convite do Discord sem expor o link no HTML/JS do site.
export const Route = createFileRoute("/api/public/join")({
  server: {
    handlers: {
      GET: async () => {
        const { resolveInviteUrl } = await import("@/lib/invite.server");
        const url = await resolveInviteUrl();
        return new Response(null, {
          status: 302,
          headers: { location: url, "cache-control": "no-store" },
        });
      },
    },
  },
});
