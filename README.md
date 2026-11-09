# JP Sports — inscrições centralizadas

Site estático para GitHub Pages com armazenamento central no Google Sheets via Google Apps Script.

## Funcionalidades
- Inscrição pública para o Treinão Novembro Azul do JP.
- Registros centralizados em uma única planilha, independentemente do dispositivo.
- Painel administrativo com uma única senha, criada uma vez no backend.
- Consulta, atualização do status de pagamento e exportação CSV.
- Pix ou cartão como forma de pagamento solicitada; o site não processa cartões.
- Declaração de ciência dos riscos e aptidão para atividade física.

## Configuração
Siga `LEIA-ME.txt`. É necessário implantar `Code.gs` como Web App e inserir a URL `/exec` em `config.js`.

**Não há cadastro público de usuários.** O backend bloqueia novas configurações após a criação da senha única.
