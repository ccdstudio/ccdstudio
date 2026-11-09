# CCD Studio v2 — Melhorias e Novo Sistema

> Proposta de reconstrução do CCD Studio em um **novo repositório**, com novo projeto Supabase e contas próprias.
> Ponto de partida: [`SISTEMA-ATUAL.md`](./SISTEMA-ATUAL.md). Prompts para revisão: [`PROMPTS.md`](./PROMPTS.md).

---

## 1. Objetivos

1. **Simplificar a stack.** Sai Prisma + NextAuth + adapter; entra Supabase (Auth, Postgres, RLS, Cron, Vault) direto.
2. **Créditos de verdade:**
   - extrato (ledger);
   - débito atômico;
   - custo fixo por feature (1 crédito, ou 2 na thumbnail);
   - **renovação mensal automática** dos créditos gratuitos.
3. **Planos e pagamentos reais** com **Stripe** (assinatura + pacotes avulsos, cartão e Pix).
4. **Integração com o YouTube** (Data API v3 + Analytics API), para oferecer serviços sobre o canal do usuário.
5. **Frontend redesenhado**, com as telas que hoje são placeholder passando a existir.
6. **Migrar tudo do sistema atual**: usuários com senha, saldos e histórico.

### Por que trocar o Prisma pelo Supabase
O ganho **não é de performance**. Cada geração gasta segundos na OpenAI, e alguns milissegundos de ORM não fazem diferença. O ganho é ter **auth, banco, permissões por linha, agendamento e segredos num lugar só**, com menos código e menos peças para manter:
- Supabase Auth substitui NextAuth + PrismaAdapter;
- RLS substitui as checagens manuais espalhadas;
- `pg_cron` substitui a necessidade de um servidor de jobs;
- tipos são gerados direto do banco.

---

## 2. Contas e infraestrutura

Crie as contas **em nome da empresa** (e-mail institucional da AM Educação, ou ao menos com 2 administradores):

| Serviço | Observação |
|---|---|
| E-mail | Dono de todas as contas abaixo |
| GitHub | Novo repositório (organização da empresa) |
| Supabase | Projetos **prod** e **staging** (staging serve para ensaiar a migração e testar webhooks) |
| Google Cloud | OAuth (login + YouTube). O app precisa ser **verificado pelo Google**, e trocar de dono depois é trabalhoso |
| Stripe | Conta BR, com Pix habilitado |
| OpenAI | Chave própria do projeto, com limite de gasto configurado |
| Hospedagem | Vercel (ou equivalente) com variáveis por ambiente |

---

## 3. Arquitetura

```
Next.js (App Router) ── @supabase/ssr ──▶ Supabase Auth (Google + e-mail/senha)
   │                                      Postgres + RLS
   │  Server Actions (server-only)         ├─ funções security definer (créditos)
   │   └─ lib/ai/*  ──▶ OpenAI             ├─ pg_cron (reset mensal)
   │                                       └─ Vault (tokens do YouTube)
   ├─ /api/stripe/webhook  ◀── Stripe
   └─ /api/youtube/callback ◀── Google OAuth (escopos do YouTube)
```

**Princípios:**
- **Toda a IA fica no servidor.** As server actions chamam direto uma função `runAiFeature()`, sem o `fetch` interno para a própria API que existe hoje.
- **Um pipeline único de IA** para todas as features: auth → validação de input → prompt → OpenAI → **validação Zod da saída** → débito → histórico. Acaba a duplicação em 5 rotas.
- **RLS em todas as tabelas.** O client só lê os próprios dados. Escritas sensíveis (créditos, assinaturas) passam só por funções do banco chamadas com service role.
- **Tipos gerados** com `supabase gen types typescript`.
- **Migrations versionadas** em `supabase/migrations` (fim do `db push`).
- **Logs sem conteúdo sensível**: nada de prompt completo, base64 ou tokens.

---

## 4. Esquema proposto (schema `public`)

| Tabela | Principais colunas | Notas |
|---|---|---|
| `profiles` | `id` (= `auth.users.id`), `name`, `avatar_url`, `role` (user/admin), `email_updates`, `plan_id`, `stripe_customer_id` | Criada por trigger quando um `auth.users` é inserido |
| `plans` | `id`, `slug`, `name`, `monthly_free_credits`, `stripe_price_id_monthly`, `stripe_price_id_yearly`, `features` (jsonb), `is_active` | O plano gratuito também é uma linha aqui |
| `credit_packs` | `id`, `credits`, `stripe_price_id`, `is_active` | Pacotes avulsos |
| `subscriptions` | `id`, `user_id`, `plan_id`, `stripe_subscription_id`, `status`, `current_period_start/end`, `cancel_at_period_end` | Espelho do Stripe, atualizado só pelo webhook |
| `credit_ledger` | `id`, `user_id`, `bucket` (`free`/`purchased`), `amount` (+/−), `reason` (`monthly_reset`, `purchase`, `subscription`, `usage`, `adjustment`, `refund`, `migration`), `ref_id`, `period` (`YYYY-MM`), `created_at` | Append-only. Índices únicos garantem a idempotência |
| `credit_balances` | `user_id`, `free`, `purchased`, `updated_at` | Saldo materializado, atualizado na mesma transação do ledger |
| `ai_generations` | `id`, `user_id`, `feature`, `prompt_version`, `model`, `input` (jsonb), `output` (jsonb), `tokens_in`, `tokens_out`, `credits_charged`, `created_at` | Mesmo papel da `AiGeneration` atual |
| `stripe_events` | `id` (= `event.id`), `type`, `processed_at` | Idempotência dos webhooks |
| `youtube_connections` | `user_id`, `channel_id`, `scopes`, `refresh_token_secret_id` (Vault), `connected_at`, `status` | Um canal por usuário (ampliável) |
| `youtube_channels`, `youtube_videos` | dados básicos e estatísticas com `fetched_at` | Cache, para economizar quota |

---

## 5. Créditos

### 5.1 Dois baldes
- **`free`**: vem do plano. **Volta a N todo mês**, sem acumular.
- **`purchased`**: créditos de assinatura paga ou pacote avulso. **São preservados.**
- O consumo debita **`free` primeiro** e depois `purchased`.

### 5.2 Débito atômico
Uma RPC `consume_credits(user_id, amount, generation_id)` (`security definer`) faz tudo em uma transação:
1. trava a linha com `SELECT ... FOR UPDATE` em `credit_balances`;
2. valida o saldo;
3. lança os débitos no ledger;
4. atualiza o saldo.

Se não houver saldo, a função dá erro. **O saldo nunca fica negativo.**

### 5.3 Custo por geração (definido)
Custo **fixo por requisição**, sem relação com os tokens:

| Feature | Custo |
|---|---|
| Otimização de vídeo (metadados) | 1 crédito |
| Roteiro | 1 crédito |
| Shorts | 1 crédito |
| Capítulos | 1 crédito |
| **Thumbnail** | **2 créditos** |

- Os custos ficam numa constante única no código (`FEATURE_COSTS`), usada pela checagem, pelo débito e pela UI, que mostra o custo no botão.
- A checagem de saldo ocorre **antes** da chamada à OpenAI e o débito **depois**, junto com o insert em `ai_generations`. Se a geração falhar ou a saída for inválida, nada é cobrado.
- Os tokens continuam registrados em `ai_generations` (`tokens_in` e `tokens_out`) só para acompanhar o custo real da OpenAI.

### 5.4 Renovação mensal (reset para N)
- **`pg_cron`**, no dia 1 às 03:00 (America/Sao_Paulo), executa `reset_monthly_free_credits()`.
- **Plano gratuito: N = 20 créditos/mês** (`plans.monthly_free_credits = 20`). Isso equivale a 20 gerações de texto ou 10 thumbnails por mês.
- Para cada usuário, a função lança no ledger um ajuste `monthly_reset` que leva o balde `free` **exatamente** a `plans.monthly_free_credits`. Pode ser positivo ou negativo, porque o que sobrou do mês expira.
- **Idempotência:** índice único `(user_id, reason='monthly_reset', period)`. Se o job rodar duas vezes, nada muda.
- **Usuários novos** recebem o reset do mês corrente no cadastro (trigger).

---

## 6. Planos e pagamentos (Stripe)

- **Produtos/preços no Stripe:** cada plano tem preço mensal e anual (os valores atuais da landing são o ponto de partida). Pacotes avulsos são pagamento único.
- **Checkout:** Stripe Checkout com cartão e **Pix**. Assinatura em modo `subscription`, pacote em modo `payment`.
- **Customer Portal:** troca de plano, cancelamento, atualização do cartão e notas.
- **Webhook `/api/stripe/webhook`:**
  - verifica a assinatura (`STRIPE_WEBHOOK_SECRET`);
  - registra o `event.id` em `stripe_events` e ignora eventos repetidos;
  - eventos tratados:
    - `checkout.session.completed` → vincula o customer e, no caso de pacote, lança créditos `purchased`;
    - `invoice.paid` → renova o período e lança os créditos do plano pago;
    - `customer.subscription.updated` / `deleted` → atualiza `subscriptions` e `profiles.plan_id` (cancelamento volta para o plano gratuito).
- **O que desbloqueia o quê:** `plans.features` controla o acesso às features (ex.: integração YouTube só a partir do Profissional). A checagem é feita no servidor.
- **Landing:** a página de preços passa a ler a tabela `plans` e os botões abrem o Checkout de verdade.

> **Definido:** plano gratuito com 20 créditos/mês; 1 crédito por requisição e 2 por thumbnail (ver 5.3).
> **A definir:** créditos de cada plano pago e preço dos pacotes avulsos.
> **Para depois:** política de reembolso.

---

## 7. IA

- **Prompts versionados no código** (`lib/ai/prompts/<feature>.ts`), com a mesma ideia do `ai-prompts.ts` atual, já revisados a partir do [`PROMPTS.md`](./PROMPTS.md).
- **Chamada:** avaliar migrar para a **Responses API** com saída estruturada (`json_schema`), como pede o `docs/instrucoes.md`, com `max_output_tokens` sempre definido e `store: false`.
- **Validação:** cada feature tem um schema Zod de saída. Se a saída for inválida, há 1 nova tentativa e, persistindo o erro, nada é cobrado.
- **Reaproveitar** do sistema atual:
  - `interpolatePrompt()`;
  - `buildTranscriptMarkdown()` (roteiro);
  - a montagem do bloco de capítulos (`mm:ss - Título`);
  - os mapeamentos de input da UI.
- **Modelos** configuráveis por feature, com fallback.

### 7.1 Thumbnail (mantém base64)
- A API continua devolvendo **`imageBase64`** (string `b64_json` da OpenAI), que é gravada em `ai_generations.output`, igual a hoje. **Sem Storage.**
- **Motor de renderização** (`lib/thumbnail-render.ts` + componente `<ThumbnailImage base64=… />`):
  - converte base64 → `Blob` → `URL.createObjectURL` para exibir, liberando com `revokeObjectURL` ao desmontar;
  - faz o download em PNG a partir do mesmo `Blob`;
  - aceita a string com ou sem o prefixo `data:image/...;base64,` e mostra um estado de erro se a decodificação falhar;
  - é usado na página da thumbnail **e** no histórico.
- **Performance:** a listagem do histórico **não** seleciona `output->'imageBase64'`. A imagem só é buscada quando o usuário abre o item.

---

## 8. Integração com o YouTube

### 8.1 Pré-requisitos (começar já, porque levam semanas)
- Projeto no Google Cloud com **YouTube Data API v3** e **YouTube Analytics API** habilitadas.
- Tela de consentimento OAuth com:
  - domínio verificado;
  - **política de privacidade** e **termos** publicados;
  - **vídeo de demonstração** do uso de cada escopo;
  - verificação do app (os escopos do YouTube são *sensíveis*).
- Quota padrão: **10.000 unidades/dia**. Exemplos de custo: leitura de lista ≈ 1, `search.list` = 100, `videos.update` = 50. Pode ser preciso pedir aumento ao Google.

### 8.2 Conexão
- É um "Conectar canal" **separado do login**, com escopos incrementais:
  1. `youtube.readonly` + `yt-analytics.readonly`: leitura e analytics;
  2. `youtube.force-ssl`: só quando o usuário ativar a atualização automática de vídeos.
- O refresh token fica criptografado no **Supabase Vault**. O access token é renovado sob demanda, no servidor.
- O usuário pode desconectar a qualquer momento, o que revoga o token no Google.

### 8.3 Features previstas
| Feature | APIs | Observação |
|---|---|---|
| Painel do canal (inscritos, views, top vídeos) | `channels.list`, `reports.query` | Cache diário |
| Lista de vídeos com métricas | `playlistItems.list` (uploads) + `videos.list` | Mais barato que `search.list` |
| **Otimizar vídeo existente** | `videos.list` → IA de metadados → `videos.update` | É o "Atualizar Vídeo" do `docs/project.md`. Exige confirmação explícita do usuário |
| Capítulos/Shorts a partir de um vídeo do canal | `captions` (se o canal tiver legendas próprias) | Hoje o usuário cola a transcrição |
| Diagnóstico de SEO do canal | dados acima + IA | Bom candidato a plano pago |

---

## 9. Frontend (redesign)

- Mantém **shadcn/ui + Tailwind 4**, com novo design system (tokens, tipografia e tema claro/escuro). O `DESIGN.md` atual serve de referência.
- **Shell:** sidebar, saldo de créditos sempre visível (free + comprados, com a data do próximo reset) e alerta de saldo baixo.
- **Telas novas ou reais:**
  - Planos e cobrança (plano atual, upgrade, portal, extrato de créditos);
  - Canal do YouTube (conexão, painel, vídeos);
  - Histórico com paginação, filtros e busca;
  - Preferências (tom de voz, termos proibidos e dados do escritório, injetados nos prompts);
  - Calendário editorial;
  - Notas de qualidade (avaliação das gerações, que alimenta a melhoria dos prompts).
- **Chat:** só entra quando tiver um caso de uso definido (hoje é mock).
- **Landing:** planos dinâmicos, links funcionando, cadastro público (se o modelo comercial passar a ter self-service) ou "fale com vendas".

---

## 10. Fases

| # | Fase | Entregas | Pronto quando |
|---|---|---|---|
| 1 | **Fundação** | Repo, Supabase (prod/staging), Auth (Google + e-mail/senha), schema + RLS + migrations, shell do novo frontend, admin de usuários com checagem de papel no servidor | Login funciona e testes de RLS passam |
| 2 | **Port da IA** | Pipeline único, 5 features com prompts revisados, histórico, motor de renderização da thumbnail | Cada feature gera, debita e aparece no histórico |
| 3 | **Créditos mensais** | Ledger, dois baldes, `consume_credits`, `reset_monthly_free_credits` + `pg_cron`, extrato na UI | Reset idempotente e débito concorrente seguro |
| 4 | **Stripe** | Planos, Checkout (cartão e Pix), Portal, webhook, gating por plano, landing dinâmica | Fluxos de compra, renovação e cancelamento testados em modo teste |
| 5 | **YouTube** | Verificação Google, conexão, painel, lista de vídeos, otimizar e aplicar no vídeo | App verificado e atualização de vídeo real funcionando |
| 6 | **Migração e cutover** | Script de migração, ensaio em staging, congelamento curto, virada de DNS | Contagens e saldos conferidos e login com senha antiga ok |

As fases 1 a 4 podem ir a produção antes da 5. A verificação do Google (fase 5) deve ser **solicitada durante a fase 1**.

---

## 11. Migração de dados (completa)

Feita com um script avulso (Node), lendo o Postgres antigo e escrevendo no Supabase com service role:

1. **Usuários** → `auth.admin.createUser({ email, password_hash, email_confirm: true })`, preservando o **hash bcrypt**. As senhas continuam valendo, sem precisar trocar.
   - Usuários só com Google entram sem senha e são vinculados no primeiro login com Google (mesmo e-mail).
   - Guardar o mapa `id antigo (cuid) → id novo (uuid)`.
2. **Perfis:** nome, avatar, `role`, `emailUpdates`.
3. **Saldo:** o `User.credits` atual vira um lançamento `purchased` com `reason = migration`, para não expirar no primeiro reset.
4. **Histórico:** cada `AiGeneration` vira um registro em `ai_generations`, com `user_id` remapeado e `created_at` preservado.
5. **Conferência:**
   - contagem de usuários e gerações na origem × destino;
   - soma dos saldos igual;
   - amostra de logins com senha.
6. **Cutover:** ensaio completo em staging → janela curta com o sistema antigo em modo leitura → migração final → troca de domínio.

---

## 12. Verificação por fase

- **Banco:**
  - `supabase start` + `supabase db reset` aplicam todas as migrations do zero;
  - testes SQL de `consume_credits` (chamadas concorrentes não deixam saldo negativo);
  - testes de `reset_monthly_free_credits` (rodar 2× no mesmo período não muda nada).
- **RLS:** o usuário A não lê dados do B. Um usuário comum não executa ações de admin nem escreve no ledger.
- **Stripe:** `stripe listen --forward-to localhost:3000/api/stripe/webhook` + `stripe trigger`. Testar também a **reentrega duplicada** do mesmo evento.
- **IA:** cada feature com input real, saída validada pelo Zod, débito correto e registro no histórico. Saída inválida não cobra.
- **YouTube:** conectar e desconectar, renovar token, aplicar metadados num vídeo de teste e acompanhar o consumo de quota.
- **E2E no navegador:** login → gerar cada feature → saldo e histórico atualizados → upgrade de plano → créditos lançados.
