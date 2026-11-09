# CCD Studio — Sistema Atual (v1)

> Retrato do sistema em **09/11/2026**, feito a partir da leitura do código no commit `f9bda32` da branch `main`.
> Serve de ponto de partida para a reconstrução descrita em [`SISTEMA-NOVO.md`](./SISTEMA-NOVO.md). Os prompts estão na íntegra em [`PROMPTS.md`](./PROMPTS.md).

---

## 1. Visão geral

**CCD Studio** (antes "Agente Youtube") é um SaaS da AM Educação que usa IA para criar conteúdo de YouTube no **nicho contábil**. O público são contadores e escritórios que querem gerar leads pelo canal.

O usuário entra, escolhe uma ferramenta, preenche um briefing curto e recebe:
- metadados de SEO;
- roteiro;
- thumbnail;
- sugestões de Shorts;
- capítulos.

Cada geração consome **1 crédito** e fica no histórico.

Não existe cadastro público. **Quem cria as contas é o administrador**, e o login com Google só funciona para e-mails que já estão cadastrados.

---

## 2. Stack

| Camada | Tecnologia (versão em `package.json`) |
|---|---|
| Framework | Next.js **16.1.3** (App Router), React **19.2.3**, TypeScript 5 |
| Estilo | Tailwind CSS 4, shadcn/ui (Radix), `tw-animate-css`, `next-themes` (claro/escuro), fonte Poppins |
| Animação | `framer-motion` / `motion`, `canvas-confetti`, `@number-flow/react` |
| Formulários | `react-hook-form` + `@hookform/resolvers` + Zod 4 |
| Banco | PostgreSQL via **Prisma 7.2** + `@prisma/adapter-pg` + `pg` |
| Auth | **Auth.js / NextAuth v5 beta** + `@auth/prisma-adapter`, `bcryptjs` |
| IA | SDK `openai` 6.x (`chat.completions` + `images.generate`) |
| UI extra | `lucide-react`, `react-icons`, `sonner` (toasts), `react-markdown` + `remark-gfm` |
| Instaladas mas **sem uso em `src/`** | `zustand`, `axios`, `@transcribe/transcriber` |

Scripts: `dev`, `build`, `start` e `postinstall` (que roda `prisma generate`). O seed fica em `prisma/seed.ts`.

---

## 3. Estrutura de pastas

```
prisma/
  schema.prisma          # modelo de dados
  migrations/            # apenas 1 migration (remove_aiprompt_table)
  seed.ts                # cria admin@aiyoutube.com (100 cr) e user@aiyoutube.com (10 cr), senha 123456
docs/                    # project.md, instrucoes.md, login.md, copy-prompt.md, script-prompt.md, youtube-analitycs.md
DESIGN.md                # referência visual (estilo monday.com)
src/
  app/
    page.tsx             # landing page
    login/, forgot-password/, not-found.tsx
    dashboard/           # área logada (layout com sidebar + saldo de créditos)
      page.tsx           # visão geral (atalhos)
      creative/ scripts/ thumbnail/ shorts/ chapters/   # features de IA
      history/ profile/ usuarios/                       # histórico, perfil, admin
      quality/ calendar/ settings/ chat/                # placeholders / mock
    api/
      auth/[...nextauth]/route.ts
      ai/generate | scripts | thumbnail | shorts | chapters /route.ts
  actions/
    ai/                  # server actions chamadas pelas páginas (uma por feature)
    auth-actions.ts      # login/logout
    profile.ts           # perfil, preferência de e-mail, troca de senha
    user-actions.ts      # CRUD de usuários (admin)
  lib/
    ai-prompts.ts        # TODOS os prompts (versionados no código)
    prompt-manager.ts    # getPrompt() + interpolatePrompt()
    openai.ts            # cliente OpenAI
    prisma.ts            # singleton Prisma
    zod.ts               # signInSchema
  components/
    ui/                  # shadcn
    dashboard/           # sidebar, nav, tabela/diálogos de usuários, history-item, profile-form
    page/                # seções da landing (Hero, Features, Pricing, Testimonials...)
  Data/dados-page.ts     # planos da landing + atalhos do dashboard + depoimentos (estáticos)
  proxy.ts               # middleware do Next 16 (proteção de /dashboard)
  auth.ts, auth.config.ts
```

---

## 4. Autenticação e autorização

- **Arquivos:** `src/auth.ts`, `src/auth.config.ts`, `src/proxy.ts`.
- **Sessão:** JWT, com `trustHost: true` e `PrismaAdapter`.
- **Provedores:**
  1. **Google OAuth** (`allowDangerousEmailAccountLinking`). No callback `signIn`, se o e-mail não existe em `User`, o usuário é redirecionado para `/login?error=UnregisteredUser`.
  2. **Google One Tap**, um provider `Credentials` com id `google-one-tap`. Ele valida o `idToken` em `oauth2.googleapis.com/tokeninfo`, confere `aud` e `email_verified` e só retorna usuários que já existem.
  3. **Facebook** (configurado no código).
  4. **E-mail/senha** (`Credentials`): valida com `signInSchema` e compara o hash com `bcrypt.compare`.
- **Papéis:** `USER` e `ADMIN`. O papel e o `emailUpdates` vão para o token JWT e depois para `session.user`.
- **Proteção de rotas:** o callback `authorized` em `auth.config.ts` bloqueia `/dashboard/*` para quem não está logado. O matcher do `proxy.ts` não cobre `/api` (as rotas de API checam `auth()` sozinhas).
- **Admin:** a página `/dashboard/usuarios` checa `role === "ADMIN"`, e a sidebar esconde o item para os demais.
- **Esqueci a senha:** não existe reset por e-mail. A página encaminha para o WhatsApp do suporte (`SUPPORT_NUMBER`).

---

## 5. Modelo de dados (`prisma/schema.prisma`)

| Model | Campos principais | Observações |
|---|---|---|
| **User** | `id` (cuid), `name`, `email` (único), `emailVerified`, `image`, `password` (bcrypt, opcional), `role` (USER/ADMIN), `emailUpdates` (bool), `credits` (Int, padrão 0), timestamps | O saldo de créditos é um inteiro direto no usuário |
| **Account** | provider, providerAccountId, tokens OAuth | Tabela do adapter do NextAuth |
| **Transaction** | `userId`, `amount`, `type` (PURCHASE/USAGE/ADJUSTMENT/REFUND), `description`, `metadata` | **Existe no schema, mas nada no código grava nela** |
| **AiGeneration** | `userId`, `feature`, `version`, `model`, `input` (Json), `output` (Json), `tokensIn`, `tokensOut`, `cost` (Decimal 10,6), `createdAt` | Histórico de todas as gerações. A thumbnail grava o **base64 da imagem dentro de `output`** |

Não há tabelas de planos, assinaturas, pagamentos ou integração com o YouTube.

---

## 6. Fluxo padrão de uma geração de IA

```
Página (client) ──FormData──▶ Server Action (src/actions/ai/*.ts)
   │  1. auth()
   │  2. pré-checagem de créditos (>= 1)
   │  3. fetch(`${NEXTAUTH_URL}/api/ai/<feature>`) repassando os cookies
   ▼
Route Handler (src/app/api/ai/<feature>/route.ts)
   1. auth()
   2. validação Zod do input
   3. getPrompt(feature)               → src/lib/prompt-manager.ts (busca em ai-prompts.ts)
   4. checagem de créditos (>= 1)
   5. interpolatePrompt(systemContent, variáveis {{...}})
   6. openai.chat.completions.create({ model: OPENAI_MODEL, response_format: json_object })
   7. JSON.parse da resposta (sem validação de schema)
   8. prisma.$transaction: debita 1 crédito + cria AiGeneration
   9. formata e retorna JSON
```

- **Modelo de texto:** `OPENAI_MODEL`, com fallback `gpt-4.1-nano`. As aspas são removidas do valor.
- **Modelo de imagem:** `OPENAI_IMAGE_MODEL`, com fallback `gpt-image-1` (o `.env.example` usa `gpt-image-1-mini`).
- **Sem `max_tokens` ou `temperature`.** O system prompt leva as variáveis já interpoladas e a mensagem `user` é uma instrução fixa.

---

## 7. Funcionalidades

### 7.1 Otimização de vídeo (metadados) — `/dashboard/creative`
- **Action/rota:** `src/actions/ai/creative.ts` → `POST /api/ai/generate` (rota genérica). Prompt `metadata-generator` v1.1.0.
- **Inputs:** `subject` (assunto), `keyword` (palavra-chave) e `objective` (objetivo). São enviados como `ASSUNTO`, `PALAVRA_CHAVE` e `OBJETIVO`, além de `theme`, `audience: "Geral"`, `objective` e `keyword`, que o prompt não usa.
- **Output (JSON):** `headline_principal`, `subheadline`, `descricao`, `perguntas_seo` (30), `cta_final`, `hashtags` (5), `tags_seo` (25 a 35), `headlines_alternativas` {provocativa, como_fazer, medo_erro} e `thumbnails` {com_imagem, apenas_texto}.
- **UI:** cards por seção com botões de copiar.
- **Custo:** 1 crédito. Atenção: o débito usa `update` com `decrement` **sem guarda de saldo** (o saldo pode ficar negativo se houver concorrência).

### 7.2 Roteiro — `/dashboard/scripts`
- **Action/rota:** `src/actions/ai/scripts.ts` → `POST /api/ai/scripts`. Prompt `script-writer` v1.0.0.
- **Inputs:** `theme`, `audience` e `objective`. A rota fixa `tone: "Didático, estratégico e persuasivo"` e `duration: "10 min"`.
- **Output (JSON):** `title`, `hook`, `introduction`, `body[]` {section, content} e `cta`.
- **Formatação:** `buildTranscriptMarkdown()` converte para Markdown (Abertura, Introdução, seções e CTA), que é exibido com `react-markdown`.
- **Custo:** 1 crédito, com débito guardado (`updateMany ... credits >= cost`).

### 7.3 Thumbnail — `/dashboard/thumbnail`
- **Action/rota:** `src/actions/ai/thumbnail.ts` → `POST /api/ai/thumbnail`. Prompt `thumbnail-generator` v1.1.0.
- **Input:** `description`, um briefing livre ou um prompt pronto.
- **Etapa 1:** `chat.completions` (sem `json_object`) gera **um prompt de imagem em uma linha**.
- **Etapa 2:** `images.generate({ size: "1536x1024" })` retorna `b64_json`.
- **Output:** `{ imageBase64, prompt, revisedPrompt, nanoBananaPrompt }`. O `nanoBananaPrompt` é o prompt acrescido de um sufixo fixo, para uso em outros geradores.
- **Renderização:** a imagem trafega e é salva como **string base64**. A página monta um data URL num `<img>` e o download gera `thumbnail-ai.png`.
- **Custo:** 1 crédito. **Não verifica o saldo antes de gerar** e debita sem guarda.

### 7.4 Shorts — `/dashboard/shorts`
- **Action/rota:** `src/actions/ai/shorts.ts` → `POST /api/ai/shorts`. Prompt `shorts-generator` v1.0.0.
- **Input:** `transcription` (transcrição do vídeo colada pelo usuário).
- **Output:** `shorts[]` {title, start, end, description, score 0 a 100}, com 3 a 7 cortes.
- **Custo:** 1 crédito (débito guardado).

### 7.5 Capítulos — `/dashboard/chapters`
- **Action/rota:** `src/actions/ai/chapters.ts` → `POST /api/ai/chapters`. Prompt `chapters-generator` v1.0.0.
- **Input:** `transcription`.
- **Output:** `chapters[]` {timestamp, title, description}. A rota também monta `formatted.description`, com linhas `mm:ss - Título` prontas para colar no YouTube.
- **Custo:** 1 crédito (débito guardado).

### 7.6 Histórico — `/dashboard/history`
- **Server component:** busca **todas** as `AiGeneration` do usuário, com `output` completo, inclusive o base64 das thumbnails, e serializa as datas.
- **Exibição:** o componente `history-item.tsx` renderiza entrada e saída de acordo com a feature.

### 7.7 Perfil — `/dashboard/profile`
- `src/actions/profile.ts`: `updateProfile` (nome e e-mail), `toggleEmailUpdates` e `updatePassword` (exige a senha atual e grava com bcrypt).

### 7.8 Usuários (admin) — `/dashboard/usuarios`
- Tabela com criar, editar e excluir (`users-table`, `user-dialog`, `edit-user-dialog`, `delete-user-dialog`).
- Actions em `src/actions/user-actions.ts`: `createUser`, `updateUser` e `deleteUser`. **Não fazem checagem de sessão nem de papel.**

### 7.9 Visão geral — `/dashboard`
- Boas-vindas com o primeiro nome e cards de atalho (`quickAccessItems` em `Data/dados-page.ts`).
- O link "Tutorial" aponta para `youtube.com`.
- O saldo de créditos aparece no layout do dashboard (consulta ao Prisma).

### 7.10 Landing page — `/`
- Seções Hero, Features, About, Pricing, Testimonials, Contact e Footer.
- Planos **estáticos** em `Data/dados-page.ts`:
  - INICIANTE: R$149 (anual R$119), "10k tokens/mês".
  - PROFISSIONAL: R$249 (anual R$219), "20k tokens/mês".
  - AGÊNCIA: R$399 (anual R$349).
- Os botões levam a `/sign-up` e `/contact`, **que não existem**. Os planos falam em "tokens", mas o sistema cobra por geração.

### 7.11 Status das telas

| Tela | Status |
|---|---|
| Otimização, Roteiro, Thumbnail, Shorts, Capítulos | ✅ Funcional, com IA real |
| Histórico, Perfil, Usuários, Login, Esqueci a senha, Landing | ✅ Funcional |
| Notas de Qualidade (`quality`) | 🟡 Placeholder "em breve" |
| Calendário (`calendar`) | 🟡 Placeholder "em breve" |
| Preferências (`settings`) | 🟡 Placeholder "em breve" |
| Chat com agente (`chat`) | 🟡 Mock (resposta simulada com `setTimeout`) |
| Atualizar vídeo / integração YouTube | ❌ Inexistente (só `docs/youtube-analitycs.md`) |
| Planos, pagamentos, assinatura | ❌ Inexistente |
| Renovação de créditos | ❌ Inexistente (créditos só mudam por seed ou edição manual) |

---

## 8. Variáveis de ambiente (`.env.example`)

| Variável | Uso |
|---|---|
| `AUTH_URL`, `NEXTAUTH_URL`, `AUTH_SECRET` | NextAuth. `NEXTAUTH_URL` também é a base do `fetch` interno das actions |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth e One Tap |
| `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | Login com Facebook |
| `DATABASE_URL`, `DIRECT_URL` | Postgres (pooler e conexão direta) |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL` | OpenAI |
| `SERVICE_TIER` | Declarada (com o valor "standart") e **não usada** |
| `SUPPORT_NUMBER` | WhatsApp do suporte (E.164 sem "+") |

---

## 9. Problemas conhecidos e dívidas técnicas

1. **Segurança:** `createUser`, `updateUser` e `deleteUser` são server actions sem `auth()` nem checagem de `ADMIN`. Qualquer usuário logado (ou não) pode chamá-las diretamente, inclusive para criar um ADMIN.
2. **Créditos:**
   - O custo é fixo em 1 por geração, sem relação com os tokens.
   - `Transaction` nunca é gravada, então não há extrato.
   - Em `/api/ai/generate` e `/api/ai/thumbnail` o débito é feito sem guarda (o saldo pode ficar negativo).
   - A thumbnail nem confere o saldo antes de chamar a OpenAI.
3. **Saída da IA:** só passa por `JSON.parse`, sem validar o schema com Zod. Campos que faltam são tratados de forma pontual na UI.
4. **Arquitetura:** a server action faz `fetch` HTTP para a própria API, o que acrescenta latência e depende de `NEXTAUTH_URL` estar correto. A lógica de crédito e prompt está duplicada em 5 rotas.
5. **Logs:** o prompt completo é impresso no console (`FINAL PROMPT`) e a resposta inteira da imagem também (incluindo o base64).
6. **Documentação × código:** `docs/instrucoes.md` pede o endpoint `/v1/responses` com `store: false`, `max_output_tokens` e `temperature`. O código usa `chat.completions` sem nenhum desses parâmetros.
7. **Histórico:** carrega o `output` completo de todas as gerações, com vários MB por thumbnail, e não tem paginação.
8. **Banco:** há uma única migration, então o schema provavelmente foi aplicado com `db push`. O seed usa senha `123456`.
9. **Landing:** os planos não estão ligados a nada e os links `/sign-up` e `/contact` estão quebrados.
10. **Diversos:**
    - README padrão do create-next-app.
    - Dependências sem uso (`zustand`, `axios`, `@transcribe/transcriber`).
    - `SERVICE_TIER` sem uso.
    - O histórico redireciona para `/auth/login`, que não existe (o certo é `/login`).
