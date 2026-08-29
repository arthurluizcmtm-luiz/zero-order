import { createFileRoute } from "@tanstack/react-router";

import { getBotConfig } from "@/lib/discord-bot.server";

const REGION_CHOICES = [
  { name: "South America (SA)", value: "sa" },
  { name: "North America (NA)", value: "na" },
  { name: "Europe (EU)", value: "eu" },
  { name: "Asia", value: "asia" },
  { name: "Africa", value: "africa" },
  { name: "Oceania", value: "oceania" },
];

const CATEGORY_CHOICES = [
  { name: "Geral", value: "geral" },
  { name: "Mobile", value: "mobile" },
  { name: "PC", value: "pc" },
  { name: "Console", value: "console" },
];

const COMMANDS = [
  {
    name: "top",
    description: "Define quem ocupa uma posição no top de uma região",
    options: [
      {
        type: 3,
        name: "regiao",
        description: "Região do ranking",
        required: true,
        choices: REGION_CHOICES,
      },
      { type: 3, name: "usuario", description: "ID do Discord da pessoa", required: true },
      {
        type: 3,
        name: "categoria",
        description: "Plataforma",
        required: true,
        choices: CATEGORY_CHOICES,
      },
      {
        type: 4,
        name: "posicao",
        description: "Posição de 1 a 10",
        required: true,
        min_value: 1,
        max_value: 10,
      },
    ],
  },
  {
    name: "topcrew",
    description: "Adiciona alguém aos Melhores da Crew",
    options: [
      { type: 3, name: "usuario", description: "ID do Discord da pessoa", required: true },
      {
        type: 4,
        name: "posicao",
        description: "Posição de entrada (1 a 100)",
        required: true,
        min_value: 1,
        max_value: 100,
      },
      {
        type: 5,
        name: "sobe",
        description: "True: quem estava sobe · False: quem estava desce",
        required: true,
      },
    ],
  },
  {
    name: "topranking",
    description: "Adiciona alguém ao ranking por nome",
    options: [
      { type: 3, name: "nome", description: "Nome (ou ID) de quem entra", required: true },
      {
        type: 4,
        name: "posicao",
        description: "Posição de entrada (1 a 100)",
        required: true,
        min_value: 1,
        max_value: 100,
      },
      {
        type: 5,
        name: "sobe",
        description: "True: quem estava sobe · False: quem estava desce",
        required: true,
      },
    ],
  },
  {
    name: "topvideos",
    description: "Adiciona um vídeo ao placar do site",
    options: [
      { type: 3, name: "link", description: "Link do vídeo", required: true },
    ],
  },
  {
    name: "perguntar",
    description: "Tire uma dúvida sobre a Zero Order (responde com IA)",
    options: [
      { type: 3, name: "pergunta", description: "Sua pergunta", required: true },
    ],
  },
];

async function register(request: Request): Promise<Response> {
  const config = await getBotConfig(true);
  const url = new URL(request.url);
  const secret = url.searchParams.get("key") ?? "";
  if (!config.publicKey || secret !== config.publicKey) {
    return new Response("unauthorized", { status: 401 });
  }
  if (!config.token || !config.appId) {
    return Response.json(
      { ok: false, error: "Faltam o token (Q1) ou o application ID (Q3) na planilha." },
      { status: 400 },
    );
  }

  const res = await fetch(
    `https://discord.com/api/v10/applications/${config.appId}/commands`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(COMMANDS),
    },
  );
  const body = await res.text();
  if (!res.ok) {
    console.error(`Registro de comandos falhou [${res.status}]: ${body}`);
    return Response.json({ ok: false, status: res.status, body }, { status: 502 });
  }
  return Response.json({ ok: true, registered: COMMANDS.map((c) => c.name) });
}

export const Route = createFileRoute("/api/public/discord-register")({
  server: {
    handlers: {
      GET: async ({ request }) => register(request),
      POST: async ({ request }) => register(request),
    },
  },
});
