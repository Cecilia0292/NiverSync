# 🎂 NiverSync — Mensagens Inteligentes com Google Calendar, WhatsApp & Gmail

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Google Gemini](https://img.shields.io/badge/Gemini_3.8_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Google Workspace](https://img.shields.io/badge/Google_Calendar_%26_Gmail-4285F4?style=for-the-badge&logo=google-calendar&logoColor=white)

<p align="center">
  <strong>Sistema full-stack completo para gestão de aniversários, sincronização bidirecional com Google Calendar, geração de mensagens personalizadas com Inteligência Artificial e envio instantâneo via WhatsApp e Gmail.</strong>
</p>

</div>

---

## 📌 Visão Geral do Projeto

O **NiverSync** foi desenvolvido para resolver um problema comum: esquecer aniversários importantes ou enviar mensagens genéricas e impessoais de última hora. 

A aplicação une:
1. **Google Calendar API**: para ler agendas de aniversários e criar eventos anuais recorrentes com lembretes automáticos.
2. **Google Gemini 3.8 Flash**: para redigir homenagens únicas, carinhosas e contextualizadas com a relação, hobbies e memórias de cada pessoa.
3. **Canais de Envio Direto**: envio em 1 clique via **WhatsApp** (com mensagem formatada) ou envio autenticado diretamente pela sua conta do **Gmail**.

---

## 🚀 Principais Funcionalidades

### 1. 📅 Sincronização Inteligente com Google Calendar
- **Importação de Aniversários**: Lê a agenda principal e a agenda secundária de aniversários do Google, identificando contatos e datas automaticamente.
- **Exportação Anual**: Cria eventos anuais recorrentes na sua agenda Google com lembretes no dia e 24h antes.
- **Proteção de Dados**: Exclusão e sincronização seguras com diálogo de confirmação explícita.

### 2. 🤖 Gerador Criativo de Mensagens com IA (Gemini 3.8 Flash)
- **6 Tons de Escrita**:
  - 💖 *Emocionante e Carinhoso* (Família, melhores amigos e parceiros)
  - 😂 *Divertido e Bem-Humorado* (Piadas leves sobre idade e descontração)
  - 👔 *Profissional e Respeitoso* (Colegas de equipe, clientes e gestores)
  - ⚡ *Curto e Marcante* (Ideal para status ou mensagens rápidas)
  - ✨ *Poético e Inspirador* (Desejos de sabedoria, luz e bênçãos)
  - 📱 *WhatsApp Casual* (Linguagem coloquial moderna e emojis estratégicos)
- **Multi-Variantes Instantâneas**: A cada geração, a IA entrega 3 opções (Principal, Mais Afetuosa e Mais Divertida), além de sugestões criativas de presentes/comemorações e assunto de e-mail.
- **Ajuste em Tempo Real ("Ajustar com IA")**: Permite refinar a mensagem com comandos como *"deixe mais curta"*, *"adicione uma piada"* ou *"mencione nosso projeto juntos"*.

### 3. 💬 Integração com WhatsApp
- **Formatação Automática de Telefone**: Converte números nacionais (com DDD) e internacionais para o padrão E.164.
- **Disparo em 1 Clique**: Abre o WhatsApp Web ou aplicativo oficial já com o texto preenchido e formatado.

### 4. ✉️ Envio Direto via Gmail API
- **Envio Autenticado**: Disparo de e-mails em HTML profissional diretamente da sua caixa do Gmail via OAuth 2.0.
- **Tela de Confirmação & Segurança (No Silent Mutations)**: Pré-visualização completa do destinatário, assunto e mensagem antes do envio definitivo.
- **Resumo Semanal Automático**: Botão para enviar um compilado de aniversários dos próximos 7 dias para o seu próprio e-mail.

### 5. ⏰ Central de Lembretes & Notificações
- **Contagem Regressiva em Tempo Real**: Filtros rápidos para *Hoje (🎉 É HOJE!)*, *Amanhã*, *Próximos 7 dias* e *Este Mês*.
- **Web Notifications API**: Alertas nativos no navegador para que nenhum aniversário passe batido.
- **Efeito Festivo**: Chuva de confetes (`canvas-confetti`) para os aniversariantes do dia.

### 6. 📜 Histórico & Auditoria
- Registro detalhado de todas as felicitações enviadas (canal utilizado, destinatário, data/hora e conteúdo).

---

## 🏛️ Como a Aplicação Funciona por Dentro (Arquitetura Simples)

Para quem não é da área técnica, o sistema funciona de forma integrada em 3 partes principais:

1. **📱 A Tela Interativa (Frontend)**:
   - Construída com **React 19**, funciona como a vitrine do aplicativo: é rápida, visual e fácil de usar.
   - Mostra a contagem regressiva dos aniversários (*"É Hoje!"*, *"Faltam 3 dias"*), solta confetes e gerencia os contatos com carregamento instantâneo.

2. **🔒 O Cérebro Seguro (Backend)**:
   - Um servidor em **Node.js** que cuida da segurança.
   - É ele quem guarda a chave secreta e conversa diretamente com a inteligência artificial (**Google Gemini 3.8 Flash**). Isso garante que suas informações e chaves nunca fiquem expostas publicamente.

3. **🌉 As Pontes de Integração (Google e WhatsApp)**:
   - **Google Calendar**: Conecta na sua agenda para descobrir aniversários e agendar alarmes anuais automáticos.
   - **Gmail**: Envia o e-mail de parabéns diretamente da sua conta, mas sempre pedindo sua confirmação antes de disparar.
   - **WhatsApp**: Prepara o link direto com a mensagem pronta no formato correto (com DDD e emojis), bastando dar um clique para enviar.

---

## 🛠️ Estrutura de Arquivos e Tecnologias

```
niversync/
├── server.ts                    # Backend Express com SDK oficial @google/genai
├── src/
│   ├── components/              # Componentes de UI (React 19 + Tailwind v4)
│   │   ├── Navbar.tsx           # Navegação e autenticação Google
│   │   ├── TodayBanner.tsx      # Banner celebrativo dos aniversariantes de hoje
│   │   ├── ContactCard.tsx      # Card de aniversariante com contagem e ações
│   │   ├── ContactModal.tsx     # Cadastro/edição com metadados para IA
│   │   ├── MessageGeneratorModal.tsx # Estúdio de IA e refinamento
│   │   ├── GmailSendModal.tsx   # Confirmação explícita de envio Gmail
│   │   ├── CalendarSyncModal.tsx# Sincronização bidirecional do Google Calendar
│   │   ├── RemindersTab.tsx     # Central de notificações e envio de resumo
│   │   └── HistoryTab.tsx       # Log de mensagens enviadas
│   ├── services/
│   │   ├── auth.ts              # Firebase Auth com in-memory token cache
│   │   ├── googleWorkspace.ts   # Chamadas à Google Calendar API v3 e Gmail API v1
│   │   ├── whatsapp.ts          # Normalização telefônica e links wa.me
│   │   └── storage.ts           # Persistência local e cálculos de signos/idades
│   ├── types/                   # Tipagens TypeScript estritas
│   └── utils/                   # Utilitários de confete e helpers
```

### Stack Técnica:
- **Linguagem**: TypeScript 5.8+ (Modo estrito)
- **Frontend**: React 19, Tailwind CSS v4, Lucide React, Canvas Confetti
- **Backend**: Node.js, Express, TSX, `@google/genai` (Google Gen AI SDK)
- **Autenticação**: Firebase Authentication (Google Auth Provider)
- **APIs Google Cloud / Workspace**:
  - `https://www.googleapis.com/auth/calendar.events` (Google Calendar API)
  - `https://www.googleapis.com/auth/gmail.send` (Gmail API)
  - Google Gemini 3.8 Flash (Text generation & structured JSON schema)

---

## 💻 Guia Passo a Passo de Execução Local

Siga as instruções abaixo para executar o projeto em sua máquina local:

### 1. Pré-requisitos
- **Node.js**: Versão 18.x ou superior instalada ([Download Node.js](https://nodejs.org/))
- **Gerenciador de Pacotes**: `npm` (incluso com o Node) ou `pnpm` / `yarn`
- **Chave de API do Google Gemini**: Obtenha gratuitamente no [Google AI Studio](https://aistudio.google.com/)

---

### 2. Clonar o Repositório
```bash
git clone https://github.com/SEU-USUARIO/niversync.git
cd niversync
```

---

### 3. Instalar as Dependências
```bash
npm install
```

---

### 4. Configurar as Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```bash
cp .env.example .env
```

Abra o arquivo `.env` e preencha sua chave do Gemini:
```env
GEMINI_API_KEY="SUA_CHAVE_DO_GEMINI_AQUI"
PORT=3000
```

> **Nota sobre Google Workspace (Calendar e Gmail)**: As credenciais de cliente OAuth do Firebase já ficam configuradas no arquivo `firebase-applet-config.json` para autenticação cliente segura.

---

### 5. Iniciar o Servidor em Modo de Desenvolvimento
```bash
npm run dev
```

A aplicação estará acessível em:
👉 **`http://localhost:3000`**

---

### 6. Build para Produção
Para validar e compilar o código para produção:

```bash
# Executa a checagem de tipos TypeScript
npm run lint

# Compila o frontend com o Vite
npm run build

# Inicia o servidor full-stack de produção
npm start
```

---

## 🏆 Destaques Técnicos sobre a Aplicação

1. **Segurança de Chaves (Server-Side Architecture)**:
   - A chamada para a API do Gemini é realizada exclusivamente no backend (`server.ts`). A chave de API nunca é exposta no bundle do cliente.
2. **Boas Práticas de Autenticação OAuth**:
   - Conforme as diretrizes de segurança, o token de acesso Google Workspace é armazenado estritamente **em memória** (`in-memory token cache`), evitando vulnerabilidades de persistência em `localStorage`.
3. **Padrão de Não-Mutação Silenciosa (Zero Silent Mutations)**:
   - Todas as ações que afetam dados do usuário (envio de e-mail no Gmail, criação ou exclusão de eventos na agenda) solicitam confirmação prévia clara com visualização dos dados.
4. **Resiliência e Fallbacks**:
   - Caso o usuário prefira não conectar a conta Google de imediato, a aplicação funciona perfeitamente com dados locais e envio direto via WhatsApp.

---

## 💡 Sobre o Projeto & Contribuições

> 🚀 **Nota**: Este projeto é um **protótipo funcional** desenvolvido com o auxílio do **Google AI Studio**, unindo o poder da inteligência artificial generativa (**Gemini 3.8 Flash**) com o ecossistema do Google Workspace e mensageria instantânea.

Sinta-se muito bem-vindo(a) para contribuir! Ideias, sugestões e melhorias são sempre bem-vindas:
- 💡 **Tem uma ideia ou feedback?** Abra uma [*Issue*](https://github.com/SEU-USUARIO/niversync/issues) para batermos um papo.
- 🛠️ **Deseja contribuir com código?** Faça um *Fork* do projeto, crie sua *branch* e envie um *Pull Request*.
- ⭐ Se este projeto foi útil ou inspirador para você, considere deixar uma estrela no repositório!

---

## 📄 Licença

Este projeto está sob a licença [Apache 2.0](LICENSE).
