# CCD MASTERS — Style Reference
> Mapa nacional premium. Navy profundo, teal de tecnologia e um dourado metálico reservado para a palavra "Master".

**Tema:** claro com seções escuras alternadas (navy) · **Stack visual:** Next.js 16 + Tailwind v4 + shadcn (base-nova / Base UI) + GSAP 3 + Hairline + Framer Motion

Este documento descreve o design **real** da landing page `app/page.tsx` e da página de perfil `app/masters/[slug]/page.tsx`. Tokens e classes citados existem no código (`app/globals.css`, `components/site/*`, `components/ui/*`). Quando algo mudar no código, atualize aqui.

O sistema trata a rede de contadores como um produto premium e institucional: fundo branco limpo e respirado, interrompido por blocos navy de alto contraste onde moram as interações mais "vivas" (hero, método, depoimentos, rodapé). O teal é a cor de ação e tecnologia (CTAs primários, ícones, estados do mapa). O dourado é **raro**: aparece como gradiente metálico na palavra "Master", no CTA "Encontrar um Master" e em pequenos detalhes (pontos pulsantes, numeração). Toda a profundidade vem de gradientes radiais suaves (brilhos teal/dourado), grids sutis com máscara e sombras azuladas — nunca de `filter: blur`/`backdrop-blur`. Movimento é parte da identidade: preloader com voo do logotipo (GSAP Flip), títulos que sobem palavra por palavra (SplitText), parallax no scroll, um palco "sticky" que troca os 4 pilares do método e figuras isométricas Hairline que respondem ao cursor.

---

## Tokens — Cores

### Marca CCD (`:root` em `app/globals.css`, expostas ao Tailwind como `ccd-*`)

| Nome | Valor | Token CSS | Classe Tailwind | Papel |
|------|-------|-----------|-----------------|-------|
| Navy | `#04223d` | `--ccd-navy` | `bg-ccd-navy`, `text-ccd-navy` | Cor institucional. Fundo da hero, painéis escuros, cards do método, texto sobre botões dourados/brancos, estado **selecionado** no mapa. |
| Navy Darker | `#021627` | `--ccd-navy-darker` | `bg-ccd-navy-darker` | O fundo mais profundo: preloader, depoimentos, rodapé, fundo do mapa SVG, base dos gradientes radiais. |
| Teal | `#0892a5` | `--ccd-teal` | `ccd-teal` | Cor de ação/tecnologia. CTA primário (gradiente), ícones, links, chevrons do accordion, estados **com Master** no mapa, badge `teal`. |
| Teal Light | `#38bdf8` | `--ccd-teal-light` | `ccd-teal-light` | Ponta clara do gradiente teal; texto de HUD em fundo escuro (`text-ccd-teal-light/80`), ícones no rodapé. |
| Teal Mist | `#b9d8dc` | `--ccd-teal-mist` | `ccd-teal-mist` | Estados **sem Master / em expansão** no mapa; `--hairline-lo` no tema claro. |
| Gold | `#c9910d` | `--ccd-gold` | `ccd-gold` | Dourado base. Numeração `01 / 03`, badge `gold`, contorno deslocado do carrossel, início/fim do gradiente metálico. |
| Gold Light | `#f2c94c` | `--ccd-gold-light` | `ccd-gold-light` | Centro do gradiente metálico; pontos pulsantes de HUD; link "devPrates"; `--hairline-hi` no tema escuro. |
| Mist | `#f5fafc` | `--ccd-mist` | `bg-ccd-mist` | Fundo alternativo claro (seções "Quem são os Masters" e "Resultados"), cápsulas de ícone, hover do menu mobile. |
| Border | `#e3eef3` | `--ccd-border` | `border-ccd-border` | Todas as bordas em superfícies claras: cards, header sólido, accordion, painéis do mapa. |
| Ink | `#0f1f2e` | `--ccd-ink` | `text-ccd-ink` | Texto padrão em fundo claro. Use opacidades: `/70` corpo, `/60` secundário, `/50`–`/40` terciário/vazio. |

### Cores auxiliares (usadas inline, não são tokens)

| Valor | Onde |
|-------|------|
| `#7fd3df` | `--hairline-edge` no tema escuro (silhuetas em teal claro) |
| `#0d3557` | `--hairline-lo` no tema escuro (o que recua) |
| `#8fbac0` | Hover de estado sem Master no mapa |
| `#ffffff` + opacidades | Texto em fundo escuro: `text-white`, `/80` nav, `/70` corpo, `/60`, `/45`–`/35` HUD; bordas `border-white/10`, `/15`, `/25`; superfícies `bg-white/5`, `/10`, `/12` |

### Tokens shadcn

`--background`, `--foreground`, `--primary` etc. existem (base neutra oklch, `--radius: 0.625rem`) e **não devem ser misturados** com os tokens CCD — o comentário no CSS diz "do not merge". Os componentes do site usam `ccd-*` diretamente; os tokens shadcn servem só aos primitivos (`Button`, `ScrollArea`, `Avatar`) e ao anel de foco (`ring`).

### Gradientes de assinatura

| Nome | Definição | Uso |
|------|-----------|-----|
| **Ouro metálico** (`text-gradient-gold`, `@utility`) | `linear-gradient(135deg, #c9910d 0%, #f2c94c 50%, #c9910d 100%)` com `background-clip: text` | **Somente** em menções-chave a "Master"/"CCD Master": h1 da hero, títulos de seção, link "Masters" do menu, preloader, rodapé. |
| Botão dourado | `bg-linear-to-r from-ccd-gold to-ccd-gold-light` + `text-ccd-navy font-semibold` | CTA "Encontrar um Master" (header) e "Ver Masters no mapa" (rodapé). |
| Botão teal | `bg-linear-to-r from-ccd-teal to-ccd-teal-light` + `text-white` | CTA primário de conteúdo ("Ver Masters no mapa" na hero, "Conheça o programa CCD"), botão de play do vídeo. |
| Banda navy→teal | `bg-linear-to-r from-ccd-navy to-ccd-teal` (ou `-br`) | Faixas de CTA com números, card "Master em destaque", hero do perfil, cabeçalho do card de contato, cápsulas de ícone, números com `bg-clip-text`. |
| Barra de progresso | `from-ccd-teal via-ccd-teal-light to-ccd-gold` | Medidor do preloader, linha vertical do método. |
| Radial de seção escura | `radial-gradient(circle at top, var(--ccd-navy) 0%, var(--ccd-navy-darker) 70%)` | Seção "Método" e faixa de produtos no perfil. |
| Brilhos (glows) | `radial-gradient(circle at X% Y%, rgba(8,146,165,.08–.35), transparent 38–40%)` + o mesmo com `rgba(201,145,13,…)` | Fundo de quase toda seção: teal num canto, dourado no oposto. Substituem `filter: blur`. |
| Grid sutil | `linear-gradient(rgba(255,255,255,.03–.05) 1px, transparent 1px)` nos dois eixos, `bg-size-[64px_64px]` (48px no perfil) + `mask-image` radial/linear | Preloader, rodapé, hero do perfil. Textura "técnica" em fundo navy. |

---

## Tokens — Tipografia

### Quicksand — a única fonte de texto · `--font-quicksand` → `--font-sans`
Carregada por `next/font/google` em `app/layout.tsx` (`subsets: latin`, `display: swap`). Geométrica e arredondada: dá um tom acessível e humano a um tema financeiro sério.
- **Pesos:** 400, 500, 600, 700
- **Uso de peso:** 700 (`font-bold`) em títulos e números; 600 (`font-semibold`) em subtítulos, h3, botões dourados e badges; 500 (`font-medium`) em nav e links; 400 no corpo.
- **Caixa:** frases normais (sentence case) em títulos e corpo. Maiúsculas só em badges e rótulos mono.
- **Tracking:** normal no texto; `tracking-tight` apenas na marca d'água do rodapé.

### Mono do sistema (`font-mono`) — a voz "HUD"
Sem fonte web: usa a pilha mono padrão do Tailwind. Aparece sempre **pequena, maiúscula e espaçada**, como leitura de instrumento: rótulos de preloader, barras de painel ("Método CCD · pilar 01"), numeração `01 / 04`, contador `000`, rótulos de coluna do rodapé, "Vídeo em breve".
- **Tamanhos:** 10–12px (`text-[10px]`, `text-[11px]`, `text-xs`)
- **Tracking:** `tracking-widest` (0.1em) até `tracking-[0.35em]`
- **Cor:** branco 35–60% em fundo escuro, `text-ccd-gold`/`ccd-gold-light` na numeração, `text-ccd-teal-light/80` para leituras ativas. Use `tabular-nums` para números que mudam.

### Escala

| Papel | Classes | Tamanho (mobile → desktop) | Peso | Line-height |
|-------|---------|----------------------------|------|-------------|
| Preloader brand | `text-5xl sm:text-7xl md:text-8xl` | 48 → 72 → 96px | 700 | `leading-tight` (1.25) |
| Display (h1 hero) | `text-4xl sm:text-5xl md:text-6xl` | 36 → 48 → 60px | 700 | `leading-tight` |
| H2 de seção (destaque) | `text-3xl md:text-5xl` | 30 → 48px | 700 | padrão |
| H2 de seção | `text-3xl md:text-4xl` | 30 → 36px | 700 | padrão |
| H2 do mapa / perfil | `text-2xl md:text-3xl/4xl` | 24 → 30/36px | 700 / 600 | padrão |
| H3 pilar ativo | `text-2xl` | 24px | 700 | padrão |
| H3 card | `text-lg` | 18px | 600 | padrão |
| Lead (hero) | `text-lg` | 18px | 400 | padrão, `max-w-2xl` |
| Corpo de seção | `text-base md:text-lg` | 16 → 18px | 400 | padrão, `max-w-2xl` |
| Corpo de card | `text-sm` | 14px | 400 | padrão |
| Número de estatística | `text-3xl md:text-4xl` / `text-4xl md:text-5xl` | 30–48px | 700 | `tabular-nums` |
| Badge | `text-[11px] uppercase tracking-wider` | 11px | 600 | — |
| HUD mono | `font-mono text-[10px]–text-xs uppercase tracking-widest…[0.35em]` | 10–12px | 400 | — |
| Marca d'água | `text-[18vw] md:text-[13vw] leading-none tracking-tight` | viewport | 700 | 1 |

---

## Tokens — Espaçamento, raios e sombras

**Densidade:** confortável e arejada — cada seção ocupa ao menos uma tela (`min-h-svh`).

### Ritmo de seção
- **Container:** `mx-auto max-w-6xl px-4 md:px-8` (1152px). FAQ usa `max-w-3xl`; grids de cards internos `max-w-4xl`/`max-w-5xl`.
- **Altura:** `min-h-svh flex flex-col justify-center`.
- **Padding vertical:** `py-20 md:py-28` (80 → 112px).
- **Âncoras:** `scroll-mt-24` em toda seção (compensa o header fixo).
- **Cabeçalho de seção:** Badge → `mt-4` H2 → `mt-4/mt-5` parágrafo → `mt-10/12/14` conteúdo.
- **Gaps:** grids de cards `gap-6`; colunas `gap-16 lg:gap-20`; listas de chips `gap-3`/`gap-4`.
- **Padding de card:** `p-6` (cards com figura), `p-8` (cards de estatística/bandas), `p-4 md:p-5` (mini-cards).

### Raios (`--radius: 0.625rem`, escala shadcn sobrescrita no `@theme inline`)

| Classe | Valor | Uso |
|--------|-------|-----|
| `rounded-lg` | 10px | Botão do menu mobile, cápsula de ícone do rodapé |
| `rounded-xl` | 14px | **Todos os botões CTA**, cápsulas de ícone pequenas, links de contato do perfil |
| `rounded-2xl` | 18px | Mini-cards (números do "Sobre"), painéis do mapa, MasterCard, card de destaque, cápsulas de ícone grandes |
| `rounded-3xl` | 22px | Cards principais (destaques Hairline, estatísticas, depoimentos, cards mobile do método), bandas de CTA |
| `rounded-[2rem]` | 32px | Molduras de mídia: vídeo, carrossel, painel do método |
| `rounded-[2.5rem]` | 40px | Hero do perfil do Master |
| `rounded-full` | 9999px | Badges, chips de feature, redes sociais, selo flutuante, botão "Ativar som", pontos de HUD, barras de progresso |

### Sombras — sempre azuladas (navy), nunca cinza neutro

| Nome | Valor | Uso |
|------|-------|-----|
| Card claro | `shadow-[0_10px_30px_rgba(4,44,78,0.06)]` | Cards brancos em repouso |
| Card claro hover | `shadow-[0_20px_45px_rgba(4,44,78,0.12)]` | Hover dos cards de destaque |
| Moldura de mídia | `shadow-[0_30px_70px_-20px_rgba(4,34,61,0.45)]` | Carrossel do "Sobre" |
| Vídeo / Hero perfil | `shadow-[0_40px_90px_-20px_rgba(4,34,61,0.55)]` (`-30px … 0.6` no perfil) | Moldura do vídeo, hero do Master |
| Painel escuro | `shadow-[0_30px_80px_rgba(2,22,39,0.6)]` | Painel do método em fundo navy |
| Utilitárias | `shadow-sm`, `shadow-lg`, `shadow-xl` | MasterCard, selos flutuantes, botão de play |

---

## Superfícies

| Nível | Nome | Valor | Papel |
|-------|------|-------|-------|
| 0 claro | Branco | `#ffffff` | Canvas da página, seções Sobre/Mapa/FAQ, cards |
| 1 claro | Mist | `#f5fafc` | Seções alternadas (Masters, Resultados), cápsulas |
| 0 escuro | Navy Darker | `#021627` | Preloader, Depoimentos, Rodapé, fundo do mapa |
| 1 escuro | Navy | `#04223d` | Hero, painéis/cards do método, moldura do vídeo |
| Vidro | `bg-white/5–/12` + `border-white/10–/25` | — | Badges, botões outline, chips sobre navy (sem blur) |

**Sequência da home (alternância claro/escuro):** Hero (navy + foto) → Quem são os Masters (mist) → Sobre (branco) → Método (radial navy) → Mapa (branco) → Resultados (mist) → Depoimentos (navy-darker) → FAQ (branco) → Rodapé (navy-darker).

---

## Componentes

### Header fixo
`fixed inset-x-0 top-0 z-50`, container `max-w-6xl py-4`. Logo `logo-masters.png` 52px à esquerda; nav central (`gap-8`, `text-sm font-medium`): Home · Sobre · **Masters** · Método · Resultados — o item "Masters" é sempre `text-gradient-gold font-bold`. À direita, CTA dourado "Encontrar um Master". Dois estados: **transparente** sobre a hero (links `text-white/80`) e **sólido** após 24px de scroll (`bg-white/95 border-b border-ccd-border`, links `text-ccd-ink/70`) com `transition-colors duration-300`. Na página de perfil usa `variant="solid"`. Sem `backdrop-blur` (era recalculado a cada frame). Mobile: hambúrguer `lucide Menu/X`, painel branco que abre com Framer Motion (altura + opacidade, 0.25s). Navegação interna via `useSectionNav` (scrollIntoView suave, sem `#` na URL).

### Botões (`components/ui/button.tsx` sobre Base UI, customizados por `className`)
Base: `variant="ghost"` + classes da marca, `nativeButton={false}` + `render={<a …/>}` para links. Altura `h-11` (`size="lg"`), `px-6`, `rounded-xl`, ícone lucide `size-4` à direita.
- **Dourado (CTA de conversão):** `bg-linear-to-r from-ccd-gold to-ccd-gold-light text-ccd-navy font-semibold hover:opacity-90`. Só para "encontrar um Master".
- **Teal (CTA primário de conteúdo):** `from-ccd-teal to-ccd-teal-light text-white hover:opacity-90`.
- **Outline em fundo escuro:** `variant="outline" border-white/25 bg-white/5 text-white hover:bg-white/10` + `ExternalLink`.
- **Branco em banda navy→teal:** `bg-white text-ccd-navy hover:bg-white/90`.
- **Pílula secundária:** `rounded-full border border-ccd-border text-sm/xs text-ccd-ink/60 hover:border-ccd-teal/40 hover:text-ccd-teal` ("Voltar ao mapa", "Limpar").

### Badge (`components/ui/badge.tsx`)
`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider`, ícone opcional `size-3`. Variantes: `navy` (`border-ccd-navy/15 bg-ccd-navy/5 text-ccd-navy`), `teal` (`/20`, `/10`), `gold` (`/25`, `/10`), `inverted` (`border-white/15 bg-white/10 text-white`). **Todo cabeçalho de seção começa com um Badge centralizado.** Na hero, badges inverted levam `bg-white/12` e também mostram as estatísticas ("+15 anos de experiência" etc.).

### Preloader "CCD Master" (`components/site/preloader.tsx` + `lib/preloader.ts`)
Overlay `fixed inset-0 z-[100]` em navy-darker com dois brilhos radiais e grid 64px mascarado. Centro: rótulo mono "Comunidade Contadores Digitais" (`tracking-[0.35em] text-white/45`), "CCD Master" gigante em ouro metálico e um medidor (barra `h-px` 224px com gradiente teal→dourado + contador mono `000→100`). Roda em todo carregamento completo da home, nunca em navegação interna. Veja **Movimento → Preloader**.

### Hero (`#inicio`)
`min-h-svh bg-ccd-navy`, foto `hero-bg-blur.jpg` (já desfocada no arquivo) em wrapper 120% de altura para parallax, overlay radial navy (0.75 → 0.35) + degradê para navy-darker na base, dois brilhos (teal no canto superior esquerdo, dourado no inferior direito, 36rem). Conteúdo centralizado `pt-28 pb-20`: Badge "Comunidade Contadores Digitais" → h1 "Encontre o **CCD Master** mais próximo de você" (`text-white`, brand em ouro, `whitespace-nowrap`) → lead `text-lg text-white/70 max-w-2xl` → CTA teal + CTA outline → badges de estatística.

### Cabeçalho de seção
Centralizado: `Badge` → `h2 text-3xl md:text-4xl font-bold` (com trecho em `text-gradient-gold` quando cita Masters) → `p max-w-2xl text-ccd-ink/60–70` (ou `text-white/60` em escuro). Envolto em `<Reveal>`.

### Moldura de vídeo HUD (Quem são os Masters)
Halo radial teal atrás; moldura `rounded-[2rem] bg-ccd-navy p-2 md:p-3 ring-1 ring-ccd-navy/10` + sombra de mídia. Barra superior mono `text-[10px] tracking-[0.25em] text-white/45 uppercase` com ponto pulsante dourado ("Conheça os Masters") e meta à direita em teal claro ("CCD · Apresentação · 40s"). Dentro, `YouTubeAutoplay` (`rounded-2xl`): thumbnail até entrar na tela, depois iframe `youtube-nocookie` mudo em loop; botão "Ativar som" `rounded-full bg-ccd-navy/85 ring-white/15 hover:bg-ccd-teal`; play `size-16 rounded-full` gradiente teal.

### Card com figura Hairline (claro)
`rounded-3xl border border-ccd-border bg-white` + sombra de card (hover mais forte). Figura no topo em largura total com `border-b border-ccd-border` e classe `hairline-ccd-light`; corpo `p-6`: numeração mono `text-xs tracking-widest text-ccd-gold` ("01 / 03") → `h3 text-lg font-semibold` → `p text-sm text-ccd-ink/60`. Grid `md:grid-cols-3 gap-6`.

### Banda de números + CTA
`rounded-3xl bg-linear-to-r from-ccd-navy to-ccd-teal p-8 md:p-10 text-white`, flex entre `<dl>` de 3 números (`CountUp`, `text-3xl md:text-4xl font-bold tabular-nums` + rótulo `text-xs md:text-sm text-white/70`) e botão branco. Mesma banda (com título + subtítulo) fecha a seção Resultados.

### Card de estatística
Claro: `rounded-2xl/3xl border border-ccd-border bg-white p-4–8` + sombra; cápsula de ícone `rounded-xl/2xl bg-linear-to-br from-ccd-navy to-ccd-teal` com ícone branco; número com `bg-linear-to-br from-ccd-navy to-ccd-teal bg-clip-text text-transparent`; descrição `text-xs/sm text-ccd-ink/60`. Variante dourada da cápsula: `from-ccd-gold to-ccd-gold-light` com ícone navy.

### Chip de feature
`rounded-full border border-ccd-border bg-white px-4 py-2 text-sm text-ccd-ink/80`, ícone lucide `size-4 text-ccd-teal`.

### Carrossel do "Sobre" (`about-carousel.tsx`)
`aspect-square rounded-[2rem]` com fundo navy→teal e sombra de mídia; contorno dourado deslocado atrás (`border-ccd-gold/40`, `translate 16px → 24px`). Barras de progresso estilo stories no topo (`h-0.5 bg-white/30`, preenchimento branco). Selo flutuante no topo direito (`rounded-full bg-ccd-navy text-xs font-semibold` + ponto dourado: "Criador do método CCD") e card de nome no canto inferior esquerdo (`rounded-2xl bg-white/95 ring-1 ring-ccd-border`).

### Palco do Método (`how-it-works.tsx`, `#metodo`)
Desktop (≥1024px): trilho de `4 × 100vh` com palco `sticky top-0 h-screen`. Grid 12 colunas: à esquerda (5) linha vertical `w-px bg-white/10` com preenchimento teal→dourado + lista `<ol>` de pilares (numeração mono, `h3 text-2xl font-bold`, descrição que expande via `grid-rows-[0fr→1fr]`; inativos `opacity-35`). À direita (7), painel `hairline-ccd-dark rounded-[2rem] border-white/10 bg-ccd-navy` com barra HUD superior ("Método CCD · pilar 01" + leitura `onRead` da figura em teal claro), figuras empilhadas em `[grid-area:1/1]` e rodapé mono com a dica de interação. Mobile/tablet: grid de cards escuros `rounded-3xl bg-ccd-navy` com a figura no topo.

### Mapa de Masters (`components/masters-map/*`, `#masters`)
Grid `md:grid-cols-5` com altura `md:h-130 lg:h-140`: painel de estado (2 col) + mapa (3 col), ambos `rounded-2xl border border-ccd-border overflow-hidden`. Mapa: Simplemaps (`/mapdata.js` + `/countrymap.js`, carregados só a ~800px da tela), fundo `#021627`, sem zoom/popup/marcadores. Cores dos estados — **uma só família teal**: com Master `#0892a5` (hover `#04223d`), sem Master `#b9d8dc` (hover `#8fbac0`), selecionado `#04223d`. Enquanto carrega, `Loader` (bússola SVG animada navy/teal/dourado). Painel vazio: card "Master em destaque" (navy→teal, badge gold, avatar com `ring-ccd-gold/60`, rotação diária determinística), passo-a-passo com números em círculos `bg-ccd-mist text-ccd-teal` e legenda com pontos coloridos. Estado selecionado: título `text-2xl md:text-3xl font-semibold`, contagem, botão "Limpar" e lista de `MasterCard`.

### MasterCard
`rounded-2xl border border-ccd-border bg-white p-3 shadow-sm`; hover `shadow-lg -translate-y-0.5 border-ccd-teal/30`. Foto 64px `rounded-xl ring-1 ring-ccd-border` (zoom 110% no hover) ou iniciais navy em fundo mist; nome `text-sm font-semibold line-clamp-2`, empresa `text-xs text-ccd-ink/50`; link "Conhecer →" `text-xs font-medium text-ccd-teal hover:text-ccd-gold` (seta desliza 2px). Entrada em stagger (Framer, x −20 → 0, 0.1s por item).

### Depoimentos
Seção navy-darker; grid de 3 prints de WhatsApp em `rounded-3xl border border-white/10 shadow-lg`, cada um com seu `aspect-ratio` real (sem corte).

### FAQ
`max-w-3xl`, figura Hairline `Query` (ponto de interrogação) centralizada acima do Badge (`w-44 md:w-52`, `-mb-2`). Accordion Base UI: itens `border-b border-ccd-border`, gatilho `py-5 font-semibold text-ccd-ink` com `ChevronDown text-ccd-teal` que gira 180°, painel `text-sm text-ccd-ink/70` animando `height` (300ms ease-out). Primeiro item aberto. Link final `font-semibold text-ccd-teal`.

### Rodapé
Navy-darker, brilhos teal/dourado + grid 64px mascarado para baixo. (1) Chamada: rótulo mono `tracking-[0.3em] text-ccd-teal-light/80` + `h2 text-2xl md:text-3xl` com "CCD Master" em ouro + CTA dourado, separada por `border-b border-white/10`. (2) Colunas 5/3/4: marca + descrição `text-white/55` + pílulas de redes (`rounded-full border-white/10 bg-white/5`, `ArrowUpRight`, hover `border-ccd-teal/50`); Navegação (rótulo mono `text-white/40`, links `hover:text-ccd-gold-light`); Contato (ícones em quadrados `size-8 rounded-lg border-white/10`). (3) Marca d'água "CCD MASTER" `text-white/[0.035]` cortada na base. (4) Crédito "Developed by **devPrates** © 2026" com link `text-ccd-gold-light`. Estático, sem animação.

### Perfil do Master (`/masters/[slug]`)
Header sólido; barra com "Voltar ao mapa"; **MasterHero** `rounded-[2.5rem] bg-linear-to-br from-ccd-navy to-ccd-teal` com grid 48px mascarado, brilho dourado que segue o mouse, avatar `size-32 md:size-40 rounded-3xl` com anel em gradiente dourado→teal, badge "CCD Master" dourado claro, nome `text-3xl md:text-5xl font-bold`, badges inverted (cidade, tempo de atuação, público) e logo da empresa em placa branca. Conteúdo em `md:grid-cols-3`: seções (Badge + h2 `text-2xl md:text-3xl`) e **card de contato sticky** (`top-24 rounded-3xl`, cabeçalho navy→teal com rótulo mono e ponto pulsante, corpo `bg-ccd-mist` com links `rounded-xl border bg-white hover:-translate-y-0.5 hover:border-ccd-teal`). Faixa de produtos em radial navy.

---

## Movimento — GSAP (assinatura do site)

Pacotes: `gsap@^3.15` (todos os plugins agora gratuitos) + `@gsap/react` (`useGSAP`). Plugins registrados por componente: **ScrollTrigger**, **SplitText**, **Flip**. Framer Motion continua para micro-entradas (`Reveal`, menu mobile, painéis do mapa).

### Regras de engenharia (não negociáveis)
1. **Só `transform` e `opacity`** (`x/y/yPercent/scale/autoAlpha`). Nada de animar `blur`, `clip-path`, `letter-spacing`, `width/height` com GSAP.
2. **Um dono por elemento.** Quando dois efeitos atuam no mesmo objeto, use wrappers: externo = mouse/scroll, interno = flutuação/intro (ex.: `[data-glow]` → `[data-glow-float]`; `[data-hero-bg-wrap]` → imagem).
3. **Sem `filter: blur`/`backdrop-blur`** em nada que se mova — use gradientes radiais e fundos um pouco mais opacos.
4. **Sempre `gsap.matchMedia()`**: efeitos contínuos só em `(prefers-reduced-motion: no-preference)`; seguir o mouse só com `(pointer: fine)`; palco do método só em `(min-width: 1024px)`. Com reduced-motion, entradas viram fade simples.
5. **Escopo e limpeza:** `useGSAP(fn, { scope: ref })`, callbacks assíncronos via `contextSafe`, `split.revert()` no cleanup.
6. **Estado inicial em CSS, não em JS:** `html[data-js] [data-hero-item] { opacity: 0 }` etc. Sem JS tudo aparece normalmente; com JS nada pisca.
7. **Scrub numérico** (`scrub: 0.6`–`0.8`) para suavizar os degraus da roda do mouse no Windows.
8. **ScrollTrigger sempre atualizado:** `ScrollTriggerRefresher` chama `ScrollTrigger.refresh()` (debounce 150ms) quando a altura da página muda, fontes/imagens carregam ou o preloader termina; `ignoreMobileResize: true`.
9. **Prefira `position: sticky` a `pin`** para palcos presos (o pin calculava posições velhas e cobria o mapa).
10. `will-change-transform` só em camadas grandes que realmente se movem (wrapper da foto, moldura do vídeo, brand do preloader).

### Curvas e durações

| Uso | Ease | Duração |
|-----|------|---------|
| Palavras subindo (SplitText) | `power4.out` | 0.9s, stagger 0.05–0.06 |
| Itens em stagger | `power3.out` | 0.6–0.7s, stagger 0.06–0.07, y 16–22px |
| Voo do brand / painel do preloader | `power4.inOut` | 1.0–1.1s |
| Contadores (`CountUp`, preloader) | `power2.out` | 1.4s |
| Avatar do perfil | `back.out(1.6)` | 0.9s, scale 0.85 → 1 |
| Flutuação de brilhos | `sine.inOut`, yoyo infinito | 4–4.5s, ±22px |
| Seguir mouse (`quickTo`) | `power3.out` | 1–1.2s |
| Crossfade de fotos | `power1.inOut` | 0.9s |
| Animações ligadas ao scroll | `none` + scrub | — |
| Intro CSS do preloader | `cubic-bezier(0.22,1,0.36,1)` / `(0.16,1,0.3,1)` | 0.6–1.1s |

### Coreografias

- **Preloader → Hero (Flip):** intro em CSS puro (`.pl-in-tag/-brand/-meter`, antes do JS). GSAP enche o contador até 88 enquanto espera `document.fonts.ready` + `decode()` da foto da hero (mín. 1.7s, máx. 4s desde a navegação), completa até 100, some medidor/rótulo (y −10), e então `Flip.fit` faz o "CCD Master" **voar e encolher até a posição exata do `[data-hero-brand]`** enquanto o fundo sobe como painel (`yPercent: -100`). A hero recebe o evento `ccd:preloader-done` 0.75s após o início do voo, para a entrada ser contínua. Scroll bloqueado sem esconder a barra; `history.scrollRestoration = 'manual'`.
- **Entrada da hero:** `SplitText` com `mask: 'words'` nos trechos `[data-hero-fade]` → palavras sobem de `yPercent: 110`; `[data-hero-item]` em stagger a partir de 0.15s. O h1 nunca recebe transform (o Flip mede sua posição).
- **Parallax da hero:** scroll de topo a fim da seção → foto `yPercent: 18`, conteúdo `y: -90` e `autoAlpha: 0.15`.
- **Brilhos seguem o mouse:** `data-glow="60"` / `"-45"` define a profundidade em px (direções opostas = sensação de camadas).
- **Vídeo que "abre":** `[data-video-frame]` de `scale 0.88, y 40` até `1, 0` entre `top bottom` e `center center`.
- **Carrossel Ken Burns:** a cada 4.5s, crossfade 0.9s; imagem de `scale 1.08 → 1`; barras de stories preenchem `scaleX`; pausa fora da tela (`ScrollTrigger.onToggle`); parallax interno `yPercent -6 → 6`.
- **Palco do método:** timeline com `scrub: 0.8` e `snap` em `1/3` (um pilar 100% visível em cada parada); linha de progresso `scaleY 0 → 1`; troca de slide = saída `y -48, scale .94` + entrada `y 48 → 0`. Clicar num pilar rola até o ponto dele. A leitura da figura é escrita direto no DOM (não em estado React) para não re-renderizar as 8 figuras.
- **CountUp:** conta de 0 ao valor (formato pt-BR) ao chegar a `top 90%`, uma vez. SSR já mostra o valor final.
- **Hero do perfil:** avatar com `back.out`, nome em SplitText, itens em stagger, brilho dourado segue o mouse (±80/±60px).

### Framer Motion (`Reveal`)
`components/ui/reveal.tsx`: `opacity 0 → 1` com deslocamento de 24px (`up` | `left` | `right` | `none`), `0.5s easeOut`, `viewport once` com margem `-80px`. Atraso `index * 0.1` em grids. Usado em todos os cabeçalhos de seção e cards.

---

## Hairline — figuras isométricas de linha

Pacote `@lucasmarkes/hairline` (React: `@lucasmarkes/hairline/react`). Figuras desenhadas em traço fino que respondem ao cursor, proporção 5:4, largura do pai. São a "ilustração" do site: **não usamos ícones grandes nem fotos de banco para explicar conceitos — usamos uma figura Hairline que encena a ideia.**

### Onde e por quê

| Figura | Local | Metáfora |
|--------|-------|----------|
| `Laptop` | Quem são os Masters · 01 | "Formados no método" — tampa abre com a altura do cursor |
| `Loupe` | Quem são os Masters · 02 | "Especialistas por nicho" — lupa amplia o trecho sob o cursor |
| `Terrain` | Quem são os Masters · 03 | "Presentes em N estados" — pilares sobem como mapa de presença |
| `Plot` | Método · Vendas | Barras que sobem |
| `Riffle` | Método · Pessoas | Fichas de talentos; a escolhida se levanta |
| `Hub` | Método · Automatização | Central ligada a processos; conexão se ativa |
| `Rebuild` | Método · Escala | Árvore de blocos; cada bloco eleva os dependentes |
| `Query` | FAQ | Interrogação que gira em direção ao cursor |

### Props usadas
- `theme`: `"light"` em cards brancos, `"dark"` em painéis navy (nunca `auto`, para não depender do `color-scheme` do sistema).
- `intensity`: 0.6 (cards claros), 0.65 (método), 0.75 (FAQ).
- `play`: `true` nos cards (a figura demonstra sozinha até o cursor chegar); no palco do método só o pilar ativo recebe `play`.
- `label`: descrição em **português** do que a figura faz (acessibilidade).
- `onRead`: alimenta a leitura do HUD no painel do método.

### Temas CCD (`app/globals.css`) — aplicar a classe na figura ou num ancestral

```css
.hairline-ccd-dark {           /* sobre bg-ccd-navy */
  --hairline-plate: var(--ccd-navy);      /* = cor do fundo, obrigatório */
  --hairline-hi: var(--ccd-gold-light);   /* o que está "aceso" */
  --hairline-edge: #7fd3df;               /* silhuetas: teal claro */
  --hairline-mid: var(--ccd-teal);
  --hairline-lo: #0d3557;                 /* o que recua */
  --hairline-stroke: 1;
}
.hairline-ccd-light {          /* sobre branco */
  --hairline-plate: #ffffff;
  --hairline-hi: var(--ccd-gold);
  --hairline-edge: var(--ccd-navy);
  --hairline-mid: var(--ccd-teal);
  --hairline-lo: var(--ccd-teal-mist);
  --hairline-stroke: 1;
}
```

**Regra crítica:** `--hairline-plate` precisa ser **igual ao fundo** onde a figura está; caso contrário as placas aparecem como blocos. Uma figura nova num fundo diferente (ex.: mist) exige um tema novo com `--hairline-plate: var(--ccd-mist)`.

Figuras novas: use as skills `/hairline-create` (ideia → figura) ou `/hairline-adopt` (SVG → figura) em `.claude/skills/`.

---

## Imagens

- **Hero:** foto já desfocada no arquivo (`hero-bg-blur.jpg`), coberta por overlay navy — nunca blur em CSS. `loading="eager"`, `fetchPriority="high"`, `data-hero-bg` (o preloader espera o `decode()`).
- **Fotos de pessoas** (Anderson, Masters): retratos reais em molduras arredondadas, com gradiente navy na base quando há texto por cima. Sem fotos de banco.
- **Prova social:** prints reais de WhatsApp, na proporção original.
- **Ícones:** `lucide-react`, `size-3`–`size-6`, normalmente teal (claro) ou teal claro/branco (escuro), muitas vezes dentro de uma cápsula com gradiente.
- Tudo via `next/image` com `sizes` corretos; WebP/JPEG otimizados em `public/`.

---

## Do's and Don'ts

### Do
- Use os tokens `ccd-*` para tudo que é da marca; texto claro sempre em `text-ccd-ink` com opacidade, nunca cinza genérico.
- Reserve `text-gradient-gold` para a palavra "Master"/"CCD Master" e o CTA dourado para "encontrar um Master". A raridade é o que faz o dourado parecer premium.
- Comece toda seção com Badge → H2 → parágrafo, centralizados, dentro de `<Reveal>`.
- Alterne fundos claro / mist / navy entre seções; dê a cada uma `min-h-svh`, `py-20 md:py-28` e `scroll-mt-24`.
- Faça profundidade com brilhos radiais teal + dourado em cantos opostos e sombras azuladas `rgba(4,44,78,…)`.
- Use a voz HUD (mono, maiúscula, espaçada, ponto pulsante dourado) em molduras de mídia e painéis "técnicos".
- Anime com GSAP só `transform`/`opacity`, com `matchMedia` para reduced-motion e pointer fino.
- Use uma figura Hairline para explicar conceitos abstratos, com `theme` explícito e o tema CCD correspondente.
- Mantenha CTAs com `rounded-xl h-11 px-6` e ícone lucide à direita.

### Don't
- Não use `filter: blur`, `backdrop-blur` ou `blur-*` em elementos que se movem ou ficam sobre áreas animadas (exceção histórica: o brilho estático do card "Master em destaque").
- Não aplique o gradiente dourado em textos longos, parágrafos ou em mais de um trecho por título.
- Não crie novas cores de destaque (roxo, verde, vermelho) — o sistema é navy + teal + dourado.
- Não use sombras cinza/pretas neutras nem `shadow-2xl` genéricas.
- Não use o `pin` do ScrollTrigger para palcos; use `sticky` + timeline com scrub.
- Não anime o mesmo elemento com dois sistemas (GSAP + CSS ou GSAP + Framer) — crie um wrapper.
- Não esqueça de `--hairline-plate` igual ao fundo.
- Não misture os tokens shadcn (`--primary`, `--background`) com os tokens CCD.
- Não use estado React para valores que mudam a cada frame (leitura de figura, posição do mouse) — escreva no DOM ou use `quickTo`.

---

## Layout

Container centralizado `max-w-6xl` com gutters `px-4 md:px-8`; nenhum elemento full-bleed além dos fundos das seções e da marca d'água do rodapé. Hero e cabeçalhos são centralizados; seções de conteúdo usam grids simples: `md:grid-cols-2` (Sobre: texto à esquerda, carrossel à direita), `md:grid-cols-3` (cards de destaque, depoimentos, perfil), `grid-cols-12` (palco do método 5/7, rodapé 5/3/4), `md:grid-cols-5` (mapa 2/3). Mobile-first: grids viram uma coluna, o palco do método vira lista de cards, o mapa empilha painel (`h-80`) sobre mapa (`h-72 sm:h-96`). Header fixo de 4 itens + CTA; rodapé completo com chamada, colunas e crédito.

---

## Agent Prompt Guide

### Referência rápida de cores
- texto (claro): `#0f1f2e` (Ink) com /70 /60 /50
- fundo: `#ffffff`, alternativo `#f5fafc` (Mist)
- fundo escuro: `#04223d` (Navy), `#021627` (Navy Darker)
- ação primária: gradiente `#0892a5 → #38bdf8` (Teal)
- conversão / destaque "Master": gradiente `#c9910d → #f2c94c` (Gold)
- borda: `#e3eef3` (claro), `rgba(255,255,255,.10)` (escuro)

### Prompts de exemplo

1. **Nova seção clara:** `<section id="x" className="flex min-h-svh flex-col justify-center scroll-mt-24 bg-white py-20 md:py-28">`, container `mx-auto w-full max-w-6xl px-4 md:px-8`, `<Reveal className="text-center">` com `<Badge variant="teal">`, `h2 mt-4 text-3xl font-bold text-ccd-ink md:text-4xl` (trecho "Masters" em `text-gradient-gold`) e `p mx-auto mt-4 max-w-2xl text-ccd-ink/60`. Brilhos radiais teal/dourado a 8% em cantos opostos.

2. **Card com figura Hairline:** `article rounded-3xl border border-ccd-border bg-white shadow-[0_10px_30px_rgba(4,44,78,0.06)] hover:shadow-[0_20px_45px_rgba(4,44,78,0.12)] overflow-hidden`; `<Terrain theme="light" intensity={0.6} play label="…" className="hairline-ccd-light w-full border-b border-ccd-border" />`; corpo `p-6` com `font-mono text-xs tracking-widest text-ccd-gold` "01 / 03", `h3 text-lg font-semibold`, `p text-sm text-ccd-ink/60`.

3. **Painel HUD escuro:** `rounded-[2rem] border border-white/10 bg-ccd-navy shadow-[0_30px_80px_rgba(2,22,39,0.6)] hairline-ccd-dark`; barra `border-b border-white/10 px-6 py-3 font-mono text-[11px] tracking-widest text-white/40 uppercase` com `size-1.5 animate-pulse rounded-full bg-ccd-gold-light` + leitura à direita em `text-ccd-teal-light/80 tabular-nums`.

4. **Banda de CTA:** `rounded-3xl bg-linear-to-r from-ccd-navy to-ccd-teal p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6`; título `text-lg font-semibold`, apoio `text-sm text-white/70`; botão `rounded-xl bg-white text-ccd-navy hover:bg-white/90`.

5. **Entrada de título com GSAP:** `useGSAP` com `scope`; `SplitText.create(el, { type: 'words', mask: 'words' })`, `gsap.from(split.words, { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.05 })`, itens `[data-item]` com `autoAlpha 0 → 1, y 22 → 0, stagger 0.07, ease power3.out`; estado inicial escondido via CSS `html[data-js] [data-item] { opacity: 0 }`; fallback de fade com reduced-motion; `split.revert()` no cleanup.

---

## Quick Start

### CSS Custom Properties (já em `app/globals.css`)

```css
:root {
  --ccd-navy: #04223d;
  --ccd-navy-darker: #021627;
  --ccd-teal: #0892a5;
  --ccd-teal-light: #38bdf8;
  --ccd-teal-mist: #b9d8dc;
  --ccd-gold: #c9910d;
  --ccd-gold-light: #f2c94c;
  --ccd-mist: #f5fafc;
  --ccd-border: #e3eef3;
  --ccd-ink: #0f1f2e;
  --radius: 0.625rem; /* escala: sm 6 · md 8 · lg 10 · xl 14 · 2xl 18 · 3xl 22 · 4xl 26px */
}
```

### Tailwind v4

```css
@theme inline {
  --color-ccd-navy: var(--ccd-navy);
  --color-ccd-navy-darker: var(--ccd-navy-darker);
  --color-ccd-teal: var(--ccd-teal);
  --color-ccd-teal-light: var(--ccd-teal-light);
  --color-ccd-teal-mist: var(--ccd-teal-mist);
  --color-ccd-gold: var(--ccd-gold);
  --color-ccd-gold-light: var(--ccd-gold-light);
  --color-ccd-mist: var(--ccd-mist);
  --color-ccd-border: var(--ccd-border);
  --color-ccd-ink: var(--ccd-ink);
  --font-sans: var(--font-quicksand), ui-sans-serif, system-ui, sans-serif;
}

@utility text-gradient-gold {
  background-image: linear-gradient(135deg, var(--ccd-gold) 0%, var(--ccd-gold-light) 50%, var(--ccd-gold) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}
```

### Esqueleto GSAP

```tsx
'use client'
import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export function Secao() {
  const ref = useRef<HTMLElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('[data-frame]', { scale: 0.88, y: 40 }, {
        scale: 1, y: 0, ease: 'none',
        scrollTrigger: { trigger: '[data-frame]', start: 'top bottom', end: 'center center', scrub: 0.6 },
      })
    })
  }, { scope: ref })
  return <section ref={ref}>…</section>
}
```

### Arquivos de referência
- Tokens e temas: `app/globals.css`
- Fonte e script do preloader: `app/layout.tsx`, `lib/preloader.ts`
- Seções: `components/site/*` · Mapa: `components/masters-map/*` · Perfil: `components/master-page/*`, `app/masters/[slug]/page.tsx`
- Primitivos: `components/ui/{badge,button,reveal,count-up,accordion,loader}.tsx`
