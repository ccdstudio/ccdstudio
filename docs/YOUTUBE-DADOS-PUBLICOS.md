# YouTube — Dados públicos do canal (fase 1, sem OAuth)

> Plano técnico para buscar os dados **públicos** do canal do usuário com a **YouTube Data API v3** usando uma
> **API key**, salvar no banco (Supabase) e manter atualizado com **pg_cron**, de forma controlada.
> Passo a passo do Google Cloud: [`GOOGLE-CLOUD-PASSO-A-PASSO.md`](./GOOGLE-CLOUD-PASSO-A-PASSO.md).
> Visão geral da integração (inclui a fase OAuth): [`SISTEMA-NOVO.md` §8](./SISTEMA-NOVO.md#8-integração-com-o-youtube).

---

## 1. Objetivo e escopo

O usuário informa o canal dele (o @handle ou a URL) e o CCD Studio passa a ter os dados públicos do canal e dos vídeos
guardados no banco, atualizados automaticamente. Esses dados alimentam o painel, a otimização de vídeos e as
features de IA (Roteiro, Shorts, Capítulos…).

| Dá para obter só com API key | Fica para a fase OAuth (permissão do usuário) |
|---|---|
| Canal: nome, @handle, descrição, foto, banner, país, data de criação | Retenção de público |
| Inscritos (arredondado; pode estar oculto), views totais, nº de vídeos | Tempo de exibição, impressões e CTR |
| Vídeos: título, descrição, tags, categoria, duração, data, thumbnail | Origem do tráfego, dados demográficos, receita |
| Estatísticas dos vídeos: views, likes, nº de comentários | Alterar título, descrição, tags (`videos.update`) |
| Playlists e comentários públicos | Prova de que o canal é do usuário |

**Sem prova de dono nesta fase:** qualquer usuário pode informar qualquer canal. Para dados públicos isso não é um
problema; quando entrarem dados privados ou escrita no canal, a conexão OAuth confirma a propriedade.

---

## 2. Fluxo do usuário

Segue as convenções do [`AGENTS.md`](../AGENTS.md#convenções-de-interface-do-ccd-studio): página em modo leitura, edição em modal.

1. Em **`/perfil`**, uma nova seção **"Canal do YouTube"** (`SectionCard` + `DataList`):
   - **Sem canal:** um texto curto e o botão **"Adicionar canal"**.
   - **Com canal:**
     - dados lidos do banco: foto, nome, @handle, inscritos, views, vídeos e "atualizado há X";
     - botões **"Trocar canal"** e **"Remover"**;
     - link "Ver no YouTube".
2. O botão abre um **`FormDialog`** com um campo: "@handle ou link do canal".
3. Ao salvar, uma **Server Action**:
   1. valida e interpreta a entrada (ver §3.2);
   2. busca o canal na API;
   3. grava ou atualiza o cache em `youtube_channels` (válido por 24h);
   4. liga ao usuário em `profiles.youtube_channel_id` (**um canal por usuário**);
   5. (fase dos vídeos) dispara a **1ª sincronização** dos vídeos na hora, só os 50 mais recentes.

> **Implementado (fase 1, só canal):** migration `0002_youtube_channel.sql`, `lib/youtube/*`, card no `/perfil`
> (`youtube-channel-card.tsx`, `youtube-channel-forms.tsx`, `youtube-actions.ts`). Ao abrir o Perfil com o cache
> vencido, a renovação roda em segundo plano (`after()`), sem a página esperar a API.
4. Toast de sucesso e a seção passa a mostrar o canal. O restante dos vídeos e as atualizações seguintes ficam com o **cron**.
5. Depois: uma tela **"Meu canal"** (no grupo Visão geral da sidebar) com a lista de vídeos paginada, os filtros e a
   evolução de inscritos e views. Isso fica fora do escopo desta fase.

---

## 3. Chamadas à API e custo de cota

### 3.1 Endpoints usados (e os proibidos)

| Para quê | Endpoint | Parâmetros | Custo |
|---|---|---|---|
| Resolver o canal pelo @handle | `channels.list` | `forHandle=@x`, `part=snippet,statistics,contentDetails,brandingSettings` | **1** |
| Resolver o canal pelo ID | `channels.list` | `id=UC…` (até 50 ids por chamada) | **1** |
| Listar os vídeos (uploads) | `playlistItems.list` | `playlistId=<uploads_playlist_id>`, `maxResults=50`, `pageToken` | **1** por página |
| Detalhes e estatísticas dos vídeos | `videos.list` | `id=<até 50 ids>`, `part=snippet,statistics,contentDetails` | **1** por lote de 50 |
| ~~Busca~~ | ~~`search.list`~~ | **Proibido no projeto** | ~~100~~ |

- A playlist de uploads vem em `channels.list → contentDetails.relatedPlaylists.uploads`.
- Pegue só os `part` necessários: o custo é o mesmo, mas a resposta é menor.

**Exemplo:** um canal com 200 vídeos custa 1 (canal) + 4 (páginas de uploads) + 4 (estatísticas) = **9 unidades** na
1ª sincronização completa. A cota padrão é **10.000 unidades por dia por projeto**, somando todos os usuários, e
reinicia à meia-noite do horário do Pacífico (04:00 ou 05:00 em Brasília).

### 3.2 Interpretar o que o usuário digita (`lib/youtube/parse-channel-input.ts`)

| Entrada | Resultado |
|---|---|
| `@nomedocanal` · `nomedocanal` | `forHandle=@nomedocanal` |
| `https://www.youtube.com/@nomedocanal` (com ou sem `/videos` etc.) | `forHandle=@nomedocanal` |
| `https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx` | `id=UC…` |
| `youtube.com/c/...` ou `/user/...` (URLs antigas) | **Não aceitar**: pedir o @handle (resolver exigiria `search.list`) |
| Link de vídeo (`watch?v=`, `youtu.be/`) | Aceitável no futuro: `videos.list` (1) → `snippet.channelId` |

Validação com zod. O handle tem de 3 a 30 caracteres, com letras, números, `.`, `_` e `-`. O ID tem `UC` seguido de 22 caracteres.

---

## 4. Modelo de dados

**Adotado (`0002_youtube_channel.sql`, aplicada):**
- `profiles.youtube_channel_id text → youtube_channels.id on delete set null`: o canal do usuário (1 por usuário).
  Substitui a tabela `user_youtube_channels` do desenho original.
- `youtube_channels`: cache das respostas de `channels.list`, com colunas estruturadas + `raw jsonb`,
  `fetched_at` e `expires_at` (24h). Apagado quando nenhum usuário aponta mais para o canal.
- `youtube_api_usage` + `increment_youtube_usage(units)` (só service role).

**Próximas fases** (vídeos e histórico, nomes previstos — migration futura `0003_youtube_videos.sql`).
O desenho original abaixo continua valendo para essas tabelas; ignore `user_youtube_channels`:

```text
youtube_channels               (1 linha por canal do YouTube, compartilhada entre usuários)
  id                 text PK          -- "UC…" (id do YouTube)
  handle             text             -- "@nomedocanal"
  title, description text
  thumbnail_url, banner_url text
  country            text
  published_at       timestamptz
  uploads_playlist_id text
  subscriber_count   bigint null      -- null quando o dono oculta (hiddenSubscriberCount)
  view_count, video_count bigint
  fetched_at         timestamptz      -- última sincronização bem-sucedida
  next_refresh_at    timestamptz      -- quando o cron deve processar de novo (fila)
  videos_synced_at   timestamptz      -- última sincronização de vídeos
  sync_status        text             -- 'pending' | 'ok' | 'error' | 'not_found'
  last_error         text
  failures           int default 0    -- para backoff
  orphaned_at        timestamptz null -- quando o último usuário removeu o canal

user_youtube_channels          (quem acompanha qual canal)
  user_id     uuid → profiles.id on delete cascade
  channel_id  text → youtube_channels.id on delete cascade
  is_primary  boolean default true    -- índice único parcial: 1 principal por usuário
  added_at    timestamptz
  PK (user_id, channel_id)

youtube_videos
  id               text PK            -- id do vídeo
  channel_id       text → youtube_channels.id on delete cascade
  title, description text
  tags             text[]
  category_id      text
  duration_seconds int
  is_short         boolean            -- heurística: duração ≤ 180 s (não é oficial)
  published_at     timestamptz
  thumbnail_url    text
  view_count, like_count, comment_count bigint null  -- likes/comentários podem estar desativados
  fetched_at       timestamptz
  índice (channel_id, published_at desc)

youtube_channel_snapshots      (histórico diário para gráficos de crescimento)
  channel_id  text → youtube_channels.id on delete cascade
  captured_on date
  subscriber_count, view_count, video_count bigint
  PK (channel_id, captured_on)

youtube_api_usage              (controle do orçamento de cota)
  day        date PK              -- dia no fuso do Pacífico (o da cota)
  units_used int default 0
  função increment_youtube_usage(units int) returns int  -- soma atômica, devolve o total do dia
```

**RLS (todas as tabelas acima):**
- `select`:
  - o usuário lê os canais ligados a ele (via `user_youtube_channels`), os vídeos e os snapshots desses canais;
  - admin e superadmin leem tudo (`current_app_role()`, da migration 0001).
- `insert/update/delete`: **nenhuma policy** para `authenticated`. Toda escrita é feita pelo servidor com service role,
  depois de checar a sessão no DAL (`lib/auth/dal.ts`), como já acontece em `profiles`.
- `youtube_api_usage`: sem leitura para usuários; só o service role, e admins por uma futura tela de monitoramento.

---

## 5. Sincronização controlada (pg_cron)

### 5.1 Arquitetura

```text
pg_cron (a cada hora)
  └─ SQL: select net.http_post(                       -- extensão pg_net
        url     := 'https://<domínio do app>/api/cron/youtube-sync',
        headers := {'Authorization': 'Bearer ' || <CRON_SECRET lido do Supabase Vault>},
        body    := {}
     )
        └─ Next.js Route Handler app/api/cron/youtube-sync/route.ts
              1. confere o segredo (comparação em tempo constante); senão 401
              2. pega um lote da fila (next_refresh_at <= now(), ordenado)
              3. sincroniza canal por canal com lib/youtube/sync.ts, respeitando o orçamento
              4. grava resultado, cota gasta e próximo agendamento
```

**Por que chamar o app em vez de rodar a lógica no banco:** a mesma lógica TypeScript (`lib/youtube/*`) atende a Server
Action, que faz a 1ª sincronização ao adicionar o canal, e o cron. Fica uma única implementação testada, com validação zod das
respostas da API.

### 5.2 Cadência (o que cada execução atualiza)

| O quê | Frequência | Custo típico |
|---|---|---|
| Estatísticas do canal + snapshot do dia | 1×/dia por canal | 1 |
| Vídeos novos: paginar uploads até encontrar um vídeo já salvo | 1×/dia por canal | 1–2 |
| Estatísticas dos vídeos publicados nos últimos 30 dias | 1×/dia por canal | 1–2 |
| Estatísticas e dados dos vídeos antigos | rodízio: 1/7 do acervo por dia | ~1–3 |

Resultado: **cada dado guardado é renovado em no máximo 30 dias**, o que atende à política da API (§8). Um canal médio custa
de 4 a 8 unidades por dia, então 8.000 unidades atendem por volta de **1.000 a 2.000 canais por dia**.

### 5.3 Controles

- **Fila:** `next_refresh_at`. Depois de um sucesso, `now() + 1 dia`. Canal novo entra com `now()`.
- **Lote por execução:** até 25 canais ou até gastar o orçamento da execução. O que sobrar fica para a próxima hora.
- **Orçamento diário:** até **8.000 unidades** pelo cron. As outras 2.000 ficam reservadas para ações manuais, como adicionar
  canal ou "atualizar agora". Antes de cada chamada, `increment_youtube_usage()`. Se passar do limite, para e retoma no dia seguinte.
- **Sem execuções sobrepostas:** `pg_try_advisory_lock` no início da rota. Se não conseguir o lock, sai sem fazer nada.
- **Backoff em erro:** `failures += 1` e `next_refresh_at = now() + 2^failures horas`, com teto de 7 dias. Depois de 5
  falhas seguidas o status vira `error` e aparece um aviso para o usuário e para o admin.
- **Canal órfão:** quando nenhum usuário acompanha mais o canal, `orphaned_at = now()`. Um job diário apaga canais órfãos há
  mais de 30 dias, junto com os vídeos e snapshots (cascade).
- **"Atualizar agora"** (botão no card): no máximo 1 vez a cada 6 horas por canal.
- **Agendamentos (pg_cron):**
  - `youtube-sync-hourly`: `0 * * * *`, chama a rota;
  - `youtube-cleanup-daily`: `30 3 * * *` em UTC, apaga os órfãos e os registros de cota antigos.

### 5.4 Ambiente local e deploy

- O pg_cron roda no Supabase (nuvem) e **não alcança `localhost`**. Em desenvolvimento, rodar o mesmo sync com
  `npm run youtube:sync` (script em `scripts/`, chamando `lib/youtube/sync.ts`).
- O agendamento real só é criado **depois do deploy**, quando existir a URL pública do app. A migration deixa as funções
  prontas e um comando documentado para ativar o `cron.schedule`.

---

## 6. Código previsto

| Arquivo | Responsabilidade |
|---|---|
| `lib/youtube/client.ts` | `fetch` para `https://www.googleapis.com/youtube/v3/...` com a `YOUTUBE_API_KEY`, `server-only`, schemas zod das respostas, custo de cada chamada e tradução dos erros (§7) |
| `lib/youtube/parse-channel-input.ts` | Interpretar @handle ou URL (§3.2) |
| `lib/youtube/sync.ts` | `syncChannel(channelId, { mode: 'initial' \| 'daily' })` com orçamento, upserts e snapshot |
| `app/api/cron/youtube-sync/route.ts` | Endpoint do cron (POST, `Authorization: Bearer CRON_SECRET`) |
| `app/(app)/perfil/youtube-actions.ts` | `addChannel`, `removeChannel`, `refreshChannel` (Server Actions com `requireUser`) |
| `app/(app)/perfil/youtube-channel-section.tsx` | Seção "Canal do YouTube" + `FormDialog` |
| `scripts/youtube-sync.mts` | Sincronização manual local (`npm run youtube:sync`) |
| `lib/env.ts`, `.env.example` | `YOUTUBE_API_KEY`, `CRON_SECRET` (só servidor, **nunca** `NEXT_PUBLIC_`) |

---

## 7. Erros e limites

| Erro da API | O que significa | O que o sistema faz |
|---|---|---|
| `quotaExceeded` (403) | Acabou a cota do dia | Para o lote, marca o dia como esgotado e retoma depois da meia-noite do Pacífico |
| `keyInvalid` / `API_KEY_INVALID` (400) | Chave errada ou apagada | Para tudo, registra o erro e avisa o admin |
| `accessNotConfigured` (403) | API não ativada no projeto | Igual ao acima (ver o passo a passo) |
| `API_KEY_SERVICE_BLOCKED` (403) | A restrição da chave bloqueia a YouTube API | Igual ao acima |
| Canal não encontrado (lista vazia) | Handle errado, canal removido ou encerrado | Na adição: mensagem no campo. No cron: `sync_status = 'not_found'` e aviso no card |
| `hiddenSubscriberCount = true` | O dono ocultou os inscritos | Salva `subscriber_count = null` e mostra "Oculto" |
| Likes ou comentários desativados | Campo ausente na resposta | Salva `null` e mostra "—" |
| 5xx / timeout | Instabilidade do Google | Tenta de novo com backoff (§5.3) |

---

## 8. Conformidade (YouTube API Services)

- Aceitar e seguir os **Termos de Serviço dos YouTube API Services** e as **Políticas para desenvolvedores**.
- O app precisa de **política de privacidade** e **termos de uso** publicados, que mencionem o uso de dados do YouTube.
- **Dados guardados precisam ser atualizados ou apagados em até 30 dias**. A cadência (§5.2) e a limpeza dos órfãos (§5.3)
  cuidam disso.
- Mostrar que os dados vêm do YouTube (ex.: "Dados públicos do YouTube" na seção) e linkar para o canal e o vídeo originais.
- Não usar a cota de forma artificial (vários projetos, por exemplo) e não vender ou expor dados brutos a terceiros.

---

## 9. Fases e checklist

**Fase 1A — Base**
- [ ] Projeto no Google Cloud com o e-mail da empresa ([passo a passo](./GOOGLE-CLOUD-PASSO-A-PASSO.md))
- [ ] `YOUTUBE_API_KEY` no `.env` (`lib/env.ts` e `.env.example` já atualizados; `CRON_SECRET` na fase 1C)
- [x] Migration `0002_youtube_channel.sql` (cache do canal, `profiles.youtube_channel_id`, RLS, `increment_youtube_usage`)
- [x] `lib/youtube/client.ts`, `parse-channel-input.ts`, `channel-cache.ts`
- [x] Vídeos recentes (migration `0004_youtube_videos_quota.sql`): os 50 últimos uploads em `youtube_videos`
      (`playlistItems.list` + `videos.list`, ~3 unidades por sincronização completa), renovados a cada 24h
- [x] Contador de cota: `youtube_api_usage` (unidades + requisições por dia do Pacífico), lido só pelo superadmin
      (`components/youtube/quota-card.tsx`, em `/meu-canal` e `/painel`)
- [x] Página **Meu canal** (`app/(app)/meu-canal/`): indicadores, views por vídeo, mais vistos e tabela dos vídeos
- [ ] Snapshots diários (histórico de inscritos/views) e pg_cron

**Fase 1B — Tela**
- [x] Card "Canal do YouTube" no `/perfil` (adicionar, trocar, remover, atualizar — no máximo 1×/hora)

**Fase 1C — Agendamento**
- [ ] Rota `/api/cron/youtube-sync` + `npm run youtube:sync`
- [ ] Após o deploy: `CRON_SECRET` no Supabase Vault, extensões `pg_cron` e `pg_net` ativas, `cron.schedule` criado

**Verificação**
- [ ] Adicionar um canal real pelo @handle e pela URL; conferir os dados no banco e no card
- [ ] Conferir a cota gasta em `youtube_api_usage` contra a tabela da §3.1
- [ ] Rodar `npm run youtube:sync` duas vezes seguidas: a 2ª não deve gastar cota com canais que não venceram
- [ ] RLS: o usuário A não lê canal, vídeos ou snapshots ligados só ao usuário B; o client não escreve em nenhuma tabela
- [ ] Simular erro (chave inválida) e conferir mensagem e backoff

**Fase 2 (depois) — OAuth:** conexão do canal com permissão do usuário, analytics e escrita (`SISTEMA-NOVO.md` §8.2).
