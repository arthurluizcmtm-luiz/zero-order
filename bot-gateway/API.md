# Zero Order — API do site

Base: `https://zero-order.lovable.app`

Todas as rotas ficam em `/api/public/` e não precisam de login do Roblox/Discord
para o navegador. Quem protege cada rota é um segredo diferente (veja abaixo).

---

## 1. `GET /api/public/data` — ler tudo (público)

Não precisa de token. Devolve o JSON exato que o site usa.

```bash
curl https://zero-order.lovable.app/api/public/data
```

Resposta (mesmo formato de `SheetData`):

```json
{
  "crew": ["<@123> Nome <False>"],
  "warRecord": { "wins": 10, "losses": 2, "raw": "..." },
  "warLogs": [{ "lines": ["..."] }],
  "skilled": [], "mobile": [], "pc": [], "console": [],
  "faq": [{ "question": "...", "answer": "..." }],
  "news": [{ "title": "...", "description": "..." }],
  "giveaways": [{ "prize": "...", "endsAt": "..." }],
  "regions": [],          "regionsMobile": [],
  "regionsPc": [],        "regionsConsole": [],
  "regionalManagers": [],
  "youtube": [], "privateServers": [],
  "spotifyUrl": "...",
  "discord": { "guildName": "...", "iconUrl": "...", "memberCount": 0, "presenceCount": 0 }
}
```

Cache: 30 segundos. Nunca devolve erro 500 com corpo vazio — em caso de falha
traz `"error": "..."`.

---

## 2. `POST /api/public/bot` — escrever na planilha (token do bot)

Usada pelo bot do gateway. Autenticação: header `x-bot-token` com o **mesmo
token** do `.env` do bot. Sem ele → `401`.

```bash
curl -X POST https://zero-order.lovable.app/api/public/bot \
  -H "content-type: application/json" \
  -H "x-bot-token: SEU_TOKEN" \
  -d '{"action":"top","regiao":"sa","categoria":"mobile","usuario":"123456789","posicao":3}'
```

Sempre responde `200` com `{ "content": "mensagem para o Discord" }`
(ou `401` quando o token está errado/ausente).

| `action` | campos |
| --- | --- |
| `addtop` | `coluna` (A–Z), `linha` (1–500), `valor` |
| `top` | `regiao`, `categoria`, `usuario`, `posicao` (1–10) |
| `removetop` | `regiao`, `categoria`, `usuario` |
| `topcrew` | `usuario`, `posicao` (1–100), `sobe` (true/false) |
| `removetopcrew` | `usuario` |
| `topranking` | `nome`, `posicao` (1–100), `sobe` |
| `topvideos` | `link` |
| `perguntar` | `pergunta` (única ação pública, usa IA) |

Regiões: `sa`, `na`, `eu`, `asia`, `africa`, `oceania`.
Categorias: `geral` (J), `mobile` (N), `pc` (O), `console` (P).
Blocos fixos de 10 linhas: SA 1–10, NA 11–20, EU 21–30, Ásia 31–40,
África 41–50, Oceania 51–60.

---

## 3. `POST /api/public/discord` — Interactions do Discord (assinatura)

Só é usada se o campo **Interactions Endpoint URL** do Developer Portal estiver
preenchido. O Discord assina cada chamada; o site confere com
`x-signature-ed25519` + `x-signature-timestamp` e a chave pública do cofre.
Assinatura inválida ou ausente → `401`.

Deixe esse campo **vazio** se o bot roda pelo gateway (`index.js`).

---

## 4. `GET /api/public/discord-register?key=<CHAVE_PUBLICA>` — registrar comandos

Registra/regrava os slash commands na aplicação. A `key` é a **chave pública**
do bot. Errada ou ausente → `401`.

```bash
curl "https://zero-order.lovable.app/api/public/discord-register?key=SUA_PUBLIC_KEY"
```

Resposta: `{ "ok": true, "registered": ["addtop","top","removetop", ...] }`

---

## 5. `GET /api/public/join` — convite do Discord (redireciona)

`302` para o link que estiver na célula **Z1** da planilha (fallback:
`https://discord.gg/atMHkzPrKA`). O link nunca aparece no HTML do site.

```bash
curl -I https://zero-order.lovable.app/api/public/join
```

---

## Variáveis do bot (`bot-gateway/.env`)

| Variável | Para que |
| --- | --- |
| `DISCORD_BOT_TOKEN` | Login no Discord **e** header `x-bot-token` da rota `/api/public/bot` |
| `DISCORD_APPLICATION_ID` | Registro dos comandos |
| `DISCORD_ROLE_ID` | Cargo que pode usar os comandos administrativos |
| `SITE_URL` | `https://zero-order.lovable.app` |

Nunca versione o `.env` (o `.gitignore` já bloqueia).

---

## Erros esperados

| Código | Quando |
| --- | --- |
| `401` | token/assinatura/chave ausente ou errada |
| `400` | JSON inválido ou configuração incompleta no cofre |
| `500` | cofre de segredos indisponível |
| `200` + `content` | ação concluída (inclusive mensagens de "não encontrei") |
