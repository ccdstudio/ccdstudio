# CCD Studio — Design

> Mesmo design e cores do **CCD Precifica**: azul como cor de ação, menu lateral em azul-marinho, páginas no canvas
> cinza-azulado e superfícies brancas. A linguagem vem da referência ClickUp (abaixo): tipografia forte com tracking
> negativo, **pílulas** em botões e badges, visual plano, sem sombras pesadas.
>
> **Esta primeira parte tem precedência sobre a referência.** Tokens reais em `app/globals.css`.

## Paleta

O projeto tem **tema claro** (padrão do Precifica) e **tema escuro** (marinho, derivado da paleta clara). O usuário
alterna no botão da topbar (`next-themes`).

| Papel | Token | Claro | Escuro |
|---|---|---|---|
| Ação principal (botões, foco, item ativo, links) | `--primary`, `--ring`, `--info`, `--brand` | `#2563eb` | `#3b82f6` |
| Fundo das páginas | `--canvas` (`bg-canvas`) | `#eef2f7` | `#0b1220` |
| Superfícies (cards, tabelas, painéis, inputs) | `--background`, `--card` | `#ffffff` | `#111a2e` |
| Popovers e menus suspensos | `--popover` | `#ffffff` | `#141f36` |
| Texto | `--foreground` | `#1c2434` | `#e6ecf7` |
| Texto secundário | `--muted-foreground` | `#5b6577` | `#94a3b8` |
| Fundos neutros | `--muted` / `--secondary` · `--accent` | `#f1f4f9` · `#eaf0fb` | `#17223a` · `#1a2a4a` |
| Bordas / campos | `--border` / `--input` | `#e3e8ef` / `#d5dce6` | `#22304d` / `#2a3a5c` |
| Menu lateral | `--sidebar` / `--sidebar-foreground` | `#0f2a5c` / `#e6ecf7` | `#0a1a3a` / `#e6ecf7` |
| Item ativo / hover do menu | `--sidebar-primary` / `--sidebar-accent` | `#2563eb` / `#17366f` | `#3b82f6` / `#14305f` |
| Sucesso | `--success` | `#00c07a` | `#34d399` |

## Regras

- **Superfícies sobre o canvas:** a página usa `bg-canvas`; todo container com borda (`rounded-xl border border-border`)
  leva `bg-card`. Listas leves podem ficar sem caixa.
- **Cabeçalho das páginas (`PageHeader`, `components/layout/page-header.tsx`):** bloco `bg-card` com borda e `rounded-2xl`,
  brilho azul sutil no canto superior direito (`bg-primary/10` desfocado) e o ícone da seção em marca d'água no canto
  inferior direito (`text-primary` a 7%). Eyebrow em MetaLabel com ponto azul. Os ícones das seções ficam em
  `components/layout/nav-icons.ts` (os mesmos do menu). Ações da página (ex.: "Novo usuário") vão no slot `actions`.
- **Cores de domínio em um só lugar** (`lib/status-colors.ts`), com a paleta padrão do Tailwind em tons suaves:
  fundo 100 e texto 700/800 no claro, fundo `500/15` e texto 300 no escuro (pontos e barras em 400/500).
  - papéis: superadmin no azul da marca, admin em índigo (marinho), usuário em neutro (slate);
  - status: ativo em emerald, inativo em red, senha temporária e avisos em amber.
- **Gráficos:** série única em `bg-primary`; várias séries com `--chart-1…5`. Valores sempre na cor do texto.
- **Sem hex soltos** nos componentes: usar os tokens acima ou os mapas de `lib/status-colors.ts`.
- **Formulários em modal:** criar e editar sempre num `Dialog` aberto por botão; páginas mostram os dados só para
  leitura (ver `AGENTS.md`).

## Tipografia

| Uso | Fonte | Peso | Tamanho / tracking |
|---|---|---|---|
| Display (home, login) | Plus Jakarta Sans (`font-heading`) | 800 | 34–80px, `-0.04em` |
| Título da página (`PageHeader`) | Plus Jakarta Sans | 700 | `text-3xl`, `-0.03em` |
| Subtítulos, títulos de card | Plus Jakarta Sans | 600–700 | 16–20px |
| Texto | Inter (`font-sans`) | 400–600 | 14–16px, tracking normal |
| Rótulo técnico / MetaLabel (`.label`) | Sometype Mono (`font-mono`) | 500 | 10–11px, caixa alta, `0.08em` |

- `h1–h3` usam `font-heading tracking-tight` por padrão.
- Não usar Plus Jakarta abaixo de 14px (use Inter); tracking positivo só nos rótulos mono em caixa alta.

## Formas, espaço e elevação

- **Raios:** botões, badges, chips, itens do menu e toggles em `rounded-full`. Inputs em `rounded-lg` (9px). Cards e
  tabelas em `rounded-xl` (12px), cabeçalhos de página em `rounded-2xl`, painéis grandes em `rounded-[20px]`.
- **Espaço:** base de 4px (utilities padrão do Tailwind). Dentro de seções 8–16px; entre blocos da página `gap-8`;
  padding de card 16–28px. Área logada no `container` do Tailwind (`px-4 sm:px-8 py-8 md:py-10`).
- **Elevação plana:** superfícies definidas por borda de 1px (`border-border`) ou `ring-1 ring-foreground/10`, não por
  sombra. No máximo dois níveis de superfície por seção.

## Componentes

- **Botão principal:** pílula `bg-primary text-primary-foreground`, 14px peso 600, `h-9 px-4`. Uma ação principal por área.
- **Botão contorno / secundário / fantasma:** pílula com borda `border-border` (contorno), `bg-secondary` (secundário)
  ou sem fundo (fantasma) — para ações alternativas e de linha de tabela.
- **Badge / status pill:** pílula 12px peso 600, cores de `lib/status-colors.ts`.
- **Input:** `h-9 rounded-lg border border-input bg-background`, foco com anel azul (`ring-ring/50`).
- **Sidebar:** marinho, recolhível para ícones. Marca no topo (quadrado branco com o ícone + "CCD Studio"), rótulos de
  grupo em mono 10px, itens em pílula com ativo em `bg-sidebar-primary`, usuário no rodapé com avatar `bg-primary`.
- **Topbar da área logada:** `h-14`, `bg-canvas/90` com blur, borda inferior, gatilho da sidebar em pílula, título da
  seção e botão de tema.
- **Telas de acesso:** duas colunas — formulário à esquerda (MetaLabel + título 34px extrabold) e, no desktop, painel
  escuro em gradiente (`#111` → `#000`, `rounded-[20px]`) com a headline do produto e benefícios com check azul.

## Do's and Don'ts

### Faça
- Títulos grandes em Plus Jakarta 700–800 com tracking negativo: é a assinatura tipográfica.
- Todos os botões, tags e badges em pílula (`rounded-full`), sem misturar raios no mesmo nível.
- Azul (`--primary`) só para ação, foco, item ativo e links de destaque.
- Borda de 1px como estrutura padrão; espaçamentos em múltiplos de 4px.

### Não faça
- Não usar `#000`/`#fff` puros para texto ou fundo de página — use os tokens (exceção: o painel escuro das telas de acesso).
- Não usar cores de status como cor de ação, nem o azul em badges de status genéricos.
- Não empilhar sombras nem mais de dois níveis de superfície numa seção.
- Não usar gradientes decorativos em cards ou fundos de seção (só no painel das telas de acesso e no brilho do `PageHeader`).
- Não usar tracking positivo em texto corrido.

## Movimento

Transições curtas e discretas: 150ms em hover, 200–300ms em abrir/fechar (sidebar, modal, dropdown), com ease-out.
Nada de animação contínua na área logada.
