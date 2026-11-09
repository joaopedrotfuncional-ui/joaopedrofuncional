# JP Sports — Inscrições pelo WhatsApp

Página estática para divulgar o Treinão Novembro Azul do JP e encaminhar solicitações de inscrição diretamente ao WhatsApp da organização.

## Publicar no GitHub Pages

1. Extraia o ZIP.
2. Envie todos os arquivos desta pasta para a raiz do repositório `https-joaopedrofuncional`.
3. No GitHub, abra **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**, branch `main` e pasta `/(root)`.
5. Aguarde a publicação.

Endereço esperado: `https://joaopedrotfuncional-ui.github.io/https-joaopedrofuncional/`

## Como funciona

- Não utiliza Supabase, banco de dados, autenticação ou chaves de API.
- O formulário valida os dados no navegador e abre uma conversa no WhatsApp `+55 81 99951-0223` com os dados preenchidos.
- A pessoa precisa tocar em **Enviar** no WhatsApp para encaminhar a solicitação.
- A organização confirma a vaga e o pagamento manualmente.
- As inscrições não ficam armazenadas em um painel administrativo nem em uma planilha automaticamente.

## Dados configurados

- Evento: Treinão Novembro Azul do JP
- Data: 29/11/2026
- Local: Mercado da Torre – Live
- Concentração: 05:00 | Largada: 05:30
- Distâncias: 3 km e 5 km
- Sem camisa: R$ 59,90
- Com camisa azul: R$ 99,90
- Pix: 52.244.653/0001-10

Para alterar telefone, preços ou dados do evento, edite `app.js` e `index.html`.
