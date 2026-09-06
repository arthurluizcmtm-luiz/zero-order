# Zero Order — Bot (Gateway)

Bot que fica conectado direto no Discord (WebSocket), sem precisar de URL de
Interactions. Ele recebe os comandos e manda as alterações para o site, que
cuida da planilha.

## Como rodar

1. Instale o Node.js 20 ou mais novo.
2. Nesta pasta, rode:

   ```bash
   npm install
   ```

3. Copie `.env.example` para `.env` e preencha:

   - `DISCORD_BOT_TOKEN` — token do bot
   - `DISCORD_APPLICATION_ID` — Application ID do bot
   - `DISCORD_ROLE_ID` — cargo que pode usar os comandos de admin
   - `SITE_URL` — `https://zero-order.lovable.app`

4. Rode:

   ```bash
   npm start
   ```

O bot registra os comandos sozinho ao ligar e fica online enquanto o processo
estiver rodando. Para deixar 24h no ar, use Railway, Fly.io, uma VPS ou
qualquer host que rode Node continuamente.

Importante: no Developer Portal, deixe o campo **Interactions Endpoint URL**
vazio — se ele estiver preenchido, o Discord usa o endpoint em vez do Gateway.

## Comandos

- `/top regiao categoria usuario posicao`
- `/removetop regiao categoria usuario`
- `/topcrew usuario posicao sobe`
- `/removetopcrew usuario`
- `/topranking nome posicao sobe`
- `/topvideos link`
- `/perguntar pergunta` (público)
