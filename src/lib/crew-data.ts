// ============================================================
// EDITE AQUI — conteúdo do site Zero Order
// ============================================================

// Discord padrão (fallback). O link OFICIAL vem da célula Z1 da planilha.
// (o link real fica apenas no servidor: src/lib/invite.server.ts)

// URL pública do site.
export const SITE_URL = "https://zero-order.lovable.app";

// Chave PIX de doação.
export const PIX_KEY = "a7acac8f-e38e-43b6-b8ca-c033c8aa8ea1";

// Planilha do Google Sheets:
// A = Melhores da crew (IDs de Discord)
// B = Top S.A (IDs de Discord) — aparece junto de Regiões
// C = Skilled, D = Mobile, E = PC, F = Console
// G = FAQ (G1 pergunta, G2 resposta, ...) até G500
// H = News (H1 título, H2 descrição, ...)
// I = Sorteios (I1 prêmio, I2 data DD/MM/YY)
// J = Rankings regionais por Discord ID
//     J1-J10 = S.A, J11-J20 = N.A, J21-J30 = Europa,
//     J31-J40 = Ásia, J41-J50 = África, J51-J60 = Oceania
// K = Vídeos do YouTube (uma URL por linha)
// L = Servidores privados do Roblox (uma URL por linha)
// Z1 = link do Discord
export const SHEET_ID = "1tC8t4AXQYskOSmg9V7Zx85K1EtvxkNVB458vSg7wpIA";
export const SHEET_GID = "0";

export const CREW_DESCRIPTION =
  "Está crew foi Fundada para chegar no topo, começou em 14/07/26, e vai conquistar o topo, nela, iremos querer somente os melhores, e por meio dos melhores, vamos dominar todos os servidores possiveis.";

export const FEATURES: { title: string; description: string }[] = [
  {
    title: "Wars",
    description:
      "Batalhas coordenadas onde a Zero Order marcha unida. Estratégia, disciplina e poder de fogo se encontram para varrer inimigos dos servidores e provar, guerra após guerra, quem realmente merece o topo.",
  },
  {
    title: "Frota de Farm",
    description:
      "Uma frota organizada dedicada a farmar recursos, frutas e níveis sem parar. Rotas otimizadas e apoio entre membros para que ninguém fique para trás na corrida rumo ao domínio.",
  },
  {
    title: "Treinadores de Jujutsu Shenanigans",
    description:
      "Mentores especializados em Jujutsu Shenanigans que lapidam as habilidades dos membros, ensinando combos, timing e domínio total do jogo.",
  },
  {
    title: "Treinadores de Blox Fruit",
    description:
      "Veteranos de Blox Fruits que guiam novatos e experientes, ajudando a escolher builds, dominar frutas e evoluir até virarem lendas dos servidores.",
  },
];

export const FAQ: { question: string; answer: string }[] = [
  {
    question: "Quantas pessoas tem na crew?",
    answer: "Por meio do link do servidor no Discord você saberá o número atual de membros.",
  },
  {
    question: "É possível entrar no momento?",
    answer:
      "Não ainda, porque ela está em desenvolvimento e será aberta em agosto ou mais cedo. Terá avisos sobre isso no Discord.",
  },
];

export const REGIONS = [
  { key: "sa", label: "South America", flag: "🌎", start: 0, end: 10 },
  { key: "na", label: "North America", flag: "🗽", start: 10, end: 20 },
  { key: "eu", label: "Europa", flag: "🏰", start: 20, end: 30 },
  { key: "asia", label: "Ásia", flag: "🏯", start: 30, end: 40 },
  { key: "africa", label: "África", flag: "🦁", start: 40, end: 50 },
  { key: "oceania", label: "Oceania", flag: "🏝️", start: 50, end: 60 },
] as const;
