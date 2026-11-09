# CCD Studio

Nova versão do CCD Studio (AM Educação).

## Stack

- Next.js 16 (App Router, React Compiler, Cache Components)
- React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui (Base UI, estilo `base-nova`, ícones Hugeicons)
- Supabase (Auth, Postgres, RLS)

## Começando

```bash
npm install
cp .env.example .env   # preencha as variáveis
npm run dev
```

Acesse http://localhost:3000.

## Scripts

| Comando             | Descrição                    |
| ------------------- | ---------------------------- |
| `npm run dev`       | Servidor de desenvolvimento  |
| `npm run build`     | Build de produção            |
| `npm run start`     | Servidor de produção         |
| `npm run typecheck` | Checagem de tipos (tsc)      |

## Estrutura

```
app/            rotas (App Router)
components/ui/  componentes shadcn  (npx shadcn add <componente>)
lib/            utilitários
docs/           documentação do sistema atual, do novo e prompts
DESIGN.md       referência visual
```

## Design

Mesmo design e cores do **CCD Precifica** (ver [`DESIGN.md`](./DESIGN.md)): azul como cor de ação, menu lateral
azul-marinho, páginas no canvas cinza-azulado e superfícies brancas, botões e badges em pílula. Tem **modo claro e
escuro** (`next-themes`, botão na topbar). Tokens em `app/globals.css`.

| Uso | Onde / classes |
| --- | --- |
| Cores | tokens semânticos: `bg-canvas`, `bg-card`, `bg-primary`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-sidebar`… |
| Status e papéis | `lib/status-colors.ts` (`ROLE_BADGE`, `STATUS_BADGE`) |
| Fontes | `font-heading` (Plus Jakarta Sans), `font-sans` (Inter), `font-mono` (Sometype Mono) |
| Rótulo técnico | `.label` (MetaLabel: mono 11px, caixa alta) |
| Cabeçalho de página | `components/layout/page-header.tsx` (`PageHeader`) |
| Ícones das seções | `components/layout/nav-icons.ts` |

**Formulários sempre em modal**: criar e editar abrem num `Dialog` a partir de um botão; páginas mostram os dados só
para leitura. Regras completas de interface em [`AGENTS.md`](./AGENTS.md#convenções-de-interface-do-ccd-studio).

Ao instalar componentes shadcn, confira se não sobrescreveram `button`, `input`, `badge`, `card` (versões do Precifica)
e `password-input`.

## Variáveis de ambiente

`DATABASE_URL` / `DIRECT_URL` (e as de NextAuth) apontam para o **sistema atual** e são usadas para consulta e
migração de dados. O app novo usa as variáveis `*SUPABASE*`.

## Autenticação e papéis

Supabase Auth (e-mail/senha) com `@supabase/ssr`. **Cadastro público desativado**: só admins criam contas.

| Papel        | Pode                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| `superadmin` | Único no sistema. Gerencia admins e usuários; é o único que cria admins        |
| `admin`      | Cria usuários, ativa/desativa e reseta a senha de contas `user`                |
| `user`       | Usa o SaaS                                                                     |

- Conta criada ou resetada recebe `DEFAULT_PASSWORD` e fica com `must_change_password=true`: a sidebar mostra um aviso "Troque sua senha" (e um ponto no menu **Perfil**) até o usuário trocar a senha em `/perfil`.
- Desativar = `is_active=false` + ban no Supabase Auth (bloqueia login e renovação de sessão).
- "Esqueceu sua senha?" → `/esqueci-senha`, com WhatsApp (`SUPPORT_WHATSAPP`) como canal principal e e-mail (`SUPPORT_EMAIL`).
- Autorização sempre no servidor via `lib/auth/dal.ts` (`requireUser`, `requireRole`, `canManage`). O `proxy.ts` só
  renova a sessão e faz redirecionamentos otimistas.
- RLS em `profiles`: o usuário lê só o próprio perfil; admins leem todos; nenhuma escrita pelo client.

### Banco

```bash
npm run db:apply          # aplica supabase/migrations + config de Auth (usa SUPABASE_ACCESS_TOKEN)
npm run db:types          # regenera lib/supabase/database.types.ts
SEED_NAME="..." SEED_EMAIL="..." SEED_PASSWORD="..." npm run seed:superadmin
```
