<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Convenções de interface do CCD Studio

Regras definidas pelo dono do produto. Siga sempre, sem exceção:

1. **Nada de formulário solto na página.** Criar e editar sempre acontecem em **modal** (`components/ui/dialog.tsx`)
   aberto por um botão ("Novo …", "Editar", "Alterar senha"). A página mostra os dados só para leitura
   (cards com `<dl>`/tabelas) e o botão de ação fica no cabeçalho do card (`CardAction`) ou na barra acima da tabela.
   - Exceções: telas que são o próprio formulário de entrada (`/login`, `/esqueci-senha`).
   - Componentes: `FormDialog` (`components/shared/form-dialog.tsx`) para o modal, `TextField`/`FormMessage`
     (`components/forms/form-field.tsx`) e `SubmitButton` (`components/forms/submit-button.tsx`) para os campos.
   - Leitura: `SectionCard` (`components/shared/section-card.tsx`) + `DataList` (`components/shared/data-list.tsx`);
     badges de papel/status com `RoleBadge`/`StatusBadge` (`components/shared/status-badge.tsx`).
   - Exemplo de referência completo: `app/(app)/perfil/` (`page.tsx` + `profile-forms.tsx`).
   - O formulário remonta a cada abertura (campos e erros limpos), fecha no sucesso e mostra um toast (`sonner`).
2. **Tabelas:** um dado por coluna (ex.: nome e e-mail em colunas separadas).
3. **Área logada sempre com a sidebar.** Telas de conta/configuração ficam em `app/(app)/`, nunca em `(auth)`.
4. **Avisos ao usuário** (ex.: senha temporária) aparecem como notificação no menu/sidebar, sem redirecionamento forçado.
5. **Design (mesmo do CCD Precifica):** seguir `DESIGN.md` (tokens em `app/globals.css`).
   - Páginas em `bg-canvas`; todo container com borda (`rounded-xl border border-border`) leva `bg-card`.
   - Toda página logada abre com `PageHeader` (`components/layout/page-header.tsx`): eyebrow, título, ícone da seção e ações.
   - Botões, badges e itens do menu em pílula (`rounded-full`); rótulos técnicos com `.label` (Sometype Mono).
   - Cores de status/papel só via `lib/status-colors.ts` (Tailwind em tons suaves). **Nada de hex solto** nos componentes.
   - Dois temas (claro em `:root`, escuro em `.dark`, via `next-themes`): use sempre os tokens semânticos.
   - Ao instalar componentes shadcn, **não sobrescrever** os customizados (`button`, `input`, `badge`, `card`,
     `password-input`): faça backup e restaure após o `shadcn add`.
