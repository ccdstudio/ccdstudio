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

O tema segue o [`DESIGN.md`](./DESIGN.md) (tema único escuro, tons quentes). Os tokens ficam em `app/globals.css`,
e a página **`/design`** mostra tudo na prática.

| Uso            | Classes                                                                   |
| -------------- | ------------------------------------------------------------------------- |
| Cores da marca | `cream`, `walnut`, `bark`, `cork`, `driftwood`, `ember` (`bg-*`, `text-*`, `border-*`) |
| Tipografia     | `text-display`, `text-heading`, `text-heading-sm`, `text-subheading`, `text-body`, `text-label`, `text-legal` |
| Utilitários    | `.label` (rótulo maiúsculo), `.legal` (micro-texto Arial), `.divider-dashed` |
| Espaçamento    | `p-card` / `gap-card` (24px), `gap-gutter` (18px)                         |
| Raios          | `rounded-card` (12px), `rounded-ghost` (22.5px), `rounded-pill` (36px)    |

Regras principais: texto sempre em `cream` (nunca `#fff`), fundo `walnut` (nunca `#000`), títulos e rótulos
em MAIÚSCULAS peso 500, sem sombras, divisores tracejados, `ember` só para créditos e destaques editoriais
(nunca em botões) e no máximo um botão preenchido por seção.

Os componentes shadcn já seguem o tema. Novos componentes (`npx shadcn add ...`) herdam as cores
automaticamente, mas confira o raio e a caixa-alta.

## Variáveis de ambiente

`DATABASE_URL` / `DIRECT_URL` (e as de NextAuth) apontam para o **sistema atual** e são usadas para consulta e
migração de dados. O app novo usa as variáveis `*SUPABASE*`.
