// ============================================================
// EDITE AQUI — conteúdo do site Zero Order
// ============================================================

// Discord padrão (fallback). O link OFICIAL vem da célula Z1 da planilha.
export const DISCORD_URL = "https://discord.gg/atMHkzPrKA";

// URL pública do site (para compartilhar). Edite se mudar o domínio.
export const SITE_URL = "https://zero-order.lovable.app";

// Planilha do Google Sheets:
// A = Melhores da crew, B = Top S.A, C = Skilled, D = Mobile, E = PC, F = Console
// Z1 = link do Discord
export const SHEET_ID = "1tC8t4AXQYskOSmg9V7Zx85K1EtvxkNVB458vSg7wpIA";
export const SHEET_GID = "0";

export const CREW_DESCRIPTION =
  "Está crew foi Fundada para chegar no topo, começou em 14/07/26, e vai conquistar o topo, nela, iremos querer somente os melhores, e por meio dos melhores, vamos dominar todos os servidores possiveis.";

// Lista dos melhores da crew — de 1 a 100.
// Substitua os nomes conforme quiser. Deixe "" para vagas ainda não preenchidas.
export const PLAYERS: string[] = [
  "ZeroCute",
  ...Array.from({ length: 99 }, (_, i) => `Vaga #${i + 2}`),
];

// O que a crew vai ter
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

// Placar Top S.A (membros da nossa crew)
export const TOP_SA: { name: string; points: number }[] = [
  { name: "ZeroCute", points: 0 },
  { name: "Vaga #2", points: 0 },
  { name: "Vaga #3", points: 0 },
];

// Perguntas e respostas — edite quando quiser
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
