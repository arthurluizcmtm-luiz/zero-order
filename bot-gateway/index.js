// Zero Order — Bot Gateway (roda 24h fora da Lovable: VPS, Railway, PC, etc.)
// Ele conecta por WebSocket no Discord (sem endpoint URL) e envia as ações
// para o site, que cuida da planilha.
import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  MessageFlags,
} from "discord.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const APP_ID = process.env.DISCORD_APPLICATION_ID;
const ROLE_ID = process.env.DISCORD_ROLE_ID;
const SITE_URL = (process.env.SITE_URL || "https://zero-order.lovable.app").replace(/\/$/, "");

if (!TOKEN || !APP_ID) {
  console.error("Faltam DISCORD_BOT_TOKEN e/ou DISCORD_APPLICATION_ID no .env");
  process.exit(1);
}

const REGIONS = [
  { name: "South America (SA)", value: "sa" },
  { name: "North America (NA)", value: "na" },
  { name: "Europe (EU)", value: "eu" },
  { name: "Asia", value: "asia" },
  { name: "Africa", value: "africa" },
  { name: "Oceania", value: "oceania" },
];

const CATEGORIES = [
  { name: "Geral", value: "geral" },
  { name: "Mobile", value: "mobile" },
  { name: "PC", value: "pc" },
  { name: "Console", value: "console" },
];

const commands = [
  new SlashCommandBuilder()
    .setName("top")
    .setDescription("Coloca alguém no top de uma região")
    .addStringOption((o) =>
      o.setName("regiao").setDescription("Região").setRequired(true).addChoices(...REGIONS))
    .addStringOption((o) =>
      o.setName("categoria").setDescription("Categoria").setRequired(true).addChoices(...CATEGORIES))
    .addUserOption((o) => o.setName("usuario").setDescription("Jogador").setRequired(true))
    .addIntegerOption((o) =>
      o.setName("posicao").setDescription("1 a 10").setRequired(true).setMinValue(1).setMaxValue(10)),

  new SlashCommandBuilder()
    .setName("removetop")
    .setDescription("Remove alguém do top de uma região")
    .addStringOption((o) =>
      o.setName("regiao").setDescription("Região").setRequired(true).addChoices(...REGIONS))
    .addStringOption((o) =>
      o.setName("categoria").setDescription("Categoria").setRequired(true).addChoices(...CATEGORIES))
    .addUserOption((o) => o.setName("usuario").setDescription("Jogador").setRequired(true)),

  new SlashCommandBuilder()
    .setName("topcrew")
    .setDescription("Coloca alguém nos Melhores da Crew")
    .addUserOption((o) => o.setName("usuario").setDescription("Jogador").setRequired(true))
    .addIntegerOption((o) =>
      o.setName("posicao").setDescription("1 a 100").setRequired(true).setMinValue(1).setMaxValue(100))
    .addBooleanOption((o) =>
      o.setName("sobe").setDescription("true = quem estava sobe, false = desce").setRequired(true)),

  new SlashCommandBuilder()
    .setName("removetopcrew")
    .setDescription("Remove alguém dos Melhores da Crew")
    .addUserOption((o) => o.setName("usuario").setDescription("Jogador").setRequired(true)),

  new SlashCommandBuilder()
    .setName("topranking")
    .setDescription("Adiciona alguém ao ranking geral")
    .addStringOption((o) => o.setName("nome").setDescription("Nome ou ID").setRequired(true))
    .addIntegerOption((o) =>
      o.setName("posicao").setDescription("1 a 100").setRequired(true).setMinValue(1).setMaxValue(100))
    .addBooleanOption((o) =>
      o.setName("sobe").setDescription("true = quem estava sobe, false = desce").setRequired(true)),

  new SlashCommandBuilder()
    .setName("topvideos")
    .setDescription("Adiciona um vídeo ao placar")
    .addStringOption((o) => o.setName("link").setDescription("Link do vídeo").setRequired(true)),

  new SlashCommandBuilder()
    .setName("perguntar")
    .setDescription("Pergunte qualquer coisa sobre a crew")
    .addStringOption((o) => o.setName("pergunta").setDescription("Sua pergunta").setRequired(true)),
].map((c) => c.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(APP_ID), { body: commands });
  console.log("Comandos registrados.");
}

async function callSite(payload) {
  const res = await fetch(`${SITE_URL}/api/public/bot`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-bot-token": TOKEN },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`site respondeu ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

const ADMIN_COMMANDS = new Set([
  "top",
  "removetop",
  "topcrew",
  "removetopcrew",
  "topranking",
  "topvideos",
]);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("clientReady", () => {
  console.log(`Online como ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const name = interaction.commandName;
  const isAdminCmd = ADMIN_COMMANDS.has(name);

  if (isAdminCmd && ROLE_ID) {
    const roles = interaction.member?.roles;
    const has = roles?.cache ? roles.cache.has(ROLE_ID) : Array.isArray(roles) && roles.includes(ROLE_ID);
    if (!has) {
      await interaction.reply({
        content: "❌ Você não tem permissão para usar este comando.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  }

  await interaction.deferReply(
    name === "perguntar" ? {} : { flags: MessageFlags.Ephemeral },
  );

  try {
    const o = interaction.options;
    const payload = { action: name };
    if (name === "top" || name === "removetop") {
      payload.regiao = o.getString("regiao");
      payload.categoria = o.getString("categoria");
      payload.usuario = o.getUser("usuario")?.id;
      if (name === "top") payload.posicao = o.getInteger("posicao");
    } else if (name === "topcrew") {
      payload.usuario = o.getUser("usuario")?.id;
      payload.posicao = o.getInteger("posicao");
      payload.sobe = o.getBoolean("sobe");
    } else if (name === "removetopcrew") {
      payload.usuario = o.getUser("usuario")?.id;
    } else if (name === "topranking") {
      payload.nome = o.getString("nome");
      payload.posicao = o.getInteger("posicao");
      payload.sobe = o.getBoolean("sobe");
    } else if (name === "topvideos") {
      payload.link = o.getString("link");
    } else if (name === "perguntar") {
      payload.pergunta = o.getString("pergunta");
    }

    const data = await callSite(payload);
    await interaction.editReply(data.content || "Feito.");
  } catch (err) {
    console.error(err);
    await interaction.editReply(`⚠️ Não consegui concluir: ${err.message}`);
  }
});

process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));

await registerCommands();
await client.login(TOKEN);
