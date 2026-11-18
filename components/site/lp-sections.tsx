import Link from "next/link"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  ChartColumnIcon,
  Clock01Icon,
  Coins01Icon,
  Fire02Icon,
  GoogleIcon,
  ListViewIcon,
  Mic01Icon,
  SparklesIcon,
  Stethoscope02Icon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons"
import { Cabinet, Format, Hub, Loupe, Padlock, Phone, Plot, Plug, Query, Stack } from "@lucasmarkes/hairline/react"
import { FEATURE_COSTS, creditsLabel } from "@/lib/credits/costs"
import { cn } from "@/lib/utils"
import { LpBadge, SectionHeading } from "./lp-badge"
import { Reveal } from "./reveal"

const SECTION = "relative flex min-h-svh scroll-mt-24 flex-col justify-center overflow-hidden py-20 md:py-28"
const CONTAINER = "relative mx-auto w-full max-w-6xl px-4 md:px-8"

function IconCapsule({ icon, gold = false, size = "md" }: { icon: IconSvgElement; gold?: boolean; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-linear-to-br",
        size === "lg" ? "size-12 rounded-2xl" : "size-10 rounded-xl",
        gold ? "from-ccd-gold to-ccd-gold-light text-ccd-navy" : "from-ccd-navy to-ccd-teal text-white",
      )}
    >
      <HugeiconsIcon icon={icon} strokeWidth={1.8} className={size === "lg" ? "size-6" : "size-5"} />
    </span>
  )
}

/* ---------------------------------------------------------------- Ferramentas (mist) */

type Figure = typeof Plot

const TOOLS: { figure: Figure; label: string; title: string; text: string; soon?: boolean }[] = [
  {
    figure: Plot,
    label: "Gráfico de barras que sobem quando o cursor passa, como o alcance de um vídeo otimizado",
    title: "Otimização de vídeo",
    text: "Você conta do que o vídeo trata e recebe opções de título, a descrição completa e as tags — o que faz o YouTube mostrar o vídeo para mais gente.",
  },
  {
    figure: Format,
    label: "Um texto de linhas tortas que se alinham conforme o cursor desce, como um roteiro organizado",
    title: "Roteiro",
    text: "Um roteiro organizado em abertura, desenvolvimento e chamada final, para você gravar sem travar e sem esquecer nada.",
  },
  {
    figure: Loupe,
    label: "Uma lupa que amplia o trecho sob o cursor",
    title: "Thumbnail",
    text: "Ideias para a imagem de capa do vídeo: o que mostrar e qual texto curto colocar para chamar o clique.",
    soon: true,
  },
  {
    figure: Phone,
    label: "Um celular em camadas que se abrem com o cursor",
    title: "Shorts",
    text: "Sugestões de trechos do vídeo longo que viram vídeos curtos e verticais.",
    soon: true,
  },
  {
    figure: Stack,
    label: "Uma pilha de cinco blocos; a altura do cursor escolhe um e os de cima se afastam",
    title: "Capítulos",
    text: "A lista de marcações de tempo que divide o vídeo em partes e ajuda quem assiste a achar o que procura.",
    soon: true,
  },
]

export function ToolsSection() {
  return (
    <section id="ferramentas" className={cn(SECTION, "bg-ccd-mist")}>
      <div aria-hidden className="absolute inset-0 lp-glows-soft" />
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading
            badge="Ferramentas de criação"
            title={
              <>
                Tudo o que o vídeo precisa, feito no <span className="text-gradient-gold">Studio</span>
              </>
            }
            description="Cada ferramenta faz poucas perguntas, uma por tela, e entrega o texto pronto para copiar e colar no YouTube. Passe o mouse nas figuras."
          />
        </Reveal>

        {/* As duas disponíveis em destaque (3 + 3 colunas); as que vêm em breve, menores (2 + 2 + 2). */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          {TOOLS.map((tool, i) => {
            const FigureEl = tool.figure
            return (
              <Reveal
                key={tool.title}
                index={i}
                className={cn("h-full", tool.soon ? "lg:col-span-2" : "lg:col-span-3", i === 4 && "md:col-span-2 lg:col-span-2")}
              >
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ccd-border bg-white shadow-lp-card transition-[box-shadow,translate] duration-300 hover:-translate-y-1 hover:shadow-lp-card-hover">
                  <div className="hairline-ccd-light relative border-b border-ccd-border bg-white">
                    <FigureEl theme="light" intensity={0.6} play label={tool.label} className={cn("mx-auto w-full", !tool.soon ? "max-w-md" : "max-w-xs")} />
                    <span className="absolute top-4 right-4">
                      {tool.soon ? <LpBadge variant="navy">Em breve</LpBadge> : <LpBadge variant="teal">Disponível</LpBadge>}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="font-mono text-xs tracking-widest text-ccd-gold">
                      {String(i + 1).padStart(2, "0")} / {String(TOOLS.length).padStart(2, "0")}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-ccd-ink">{tool.title}</h3>
                    <p className="mt-2 text-sm text-ccd-ink/60">{tool.text}</p>
                  </div>
                </article>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- Análises (branco) */

const ANALYSES: { icon: IconSvgElement; title: string; text: string }[] = [
  {
    icon: Stethoscope02Icon,
    title: "Diagnóstico do canal",
    text: "Uma revisão geral: o que está bom, o que está atrapalhando e por onde começar a melhorar.",
  },
  {
    icon: Fire02Icon,
    title: "Vídeos que estouraram",
    text: "Quais vídeos foram muito acima da sua média e o que eles têm em comum.",
  },
  {
    icon: ChartColumnIcon,
    title: "Melhor dia e ritmo",
    text: "Em que dia da semana seus vídeos vão melhor e com que frequência vale publicar.",
  },
  {
    icon: Mic01Icon,
    title: "Seu jeito de falar",
    text: "A IA aprende o seu vocabulário e o seu tom, e passa a escrever como você. É grátis.",
  },
]

/** Painel HUD ilustrativo: mostra como uma leitura do canal aparece (dados de exemplo). */
function HudPanel() {
  const rows = [
    { label: "Vídeos analisados", value: "48" },
    { label: "Melhor dia", value: "Terça" },
    { label: "Acima da média", value: "6 vídeos" },
    { label: "Ritmo sugerido", value: "1 por semana" },
  ]
  return (
    <div className="rounded-[2rem] border border-white/10 bg-ccd-navy p-2 shadow-lp-media md:p-3">
      <div className="flex items-center justify-between px-4 py-3 font-mono text-[10px] tracking-[0.25em] text-white/45 uppercase">
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-ccd-gold-light" />
          Diagnóstico do canal
        </span>
        <span className="text-ccd-teal-light/80">Exemplo</span>
      </div>
      <div className="rounded-2xl border border-white/10 bg-ccd-navy-darker p-5 md:p-6">
        <dl className="grid grid-cols-2 gap-3">
          {rows.map((r) => (
            <div key={r.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="font-mono text-[10px] tracking-widest text-white/45 uppercase">{r.label}</dt>
              <dd className="mt-2 text-xl font-bold text-white tabular-nums">{r.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-white/45 uppercase">
            <span>Saúde dos títulos</span>
            <span className="text-ccd-teal-light/80 tabular-nums">72%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[72%] rounded-full bg-linear-to-r from-ccd-teal via-ccd-teal-light to-ccd-gold" />
          </div>
        </div>
        <p className="mt-5 rounded-2xl border border-ccd-gold/25 bg-ccd-gold/10 p-4 text-sm text-white/80">
          <span className="font-semibold text-ccd-gold-light">Próximo passo:</span> seus vídeos de “passo a passo”
          rendem o dobro. Grave mais deles e publique às terças.
        </p>
      </div>
    </div>
  )
}

export function AnalysesSection() {
  return (
    <section id="analises" className={cn(SECTION, "bg-white")}>
      <div aria-hidden className="absolute inset-0 lp-glows-soft" />
      <div className={cn(CONTAINER, "grid items-center gap-16 lg:grid-cols-2 lg:gap-20")}>
        <div>
          <Reveal direction="left">
            <LpBadge variant="teal">Análises do canal</LpBadge>
            <h2 className="mt-4 text-3xl font-bold text-ccd-ink md:text-4xl">Entenda o seu canal antes de criar</h2>
            <p className="mt-5 max-w-xl text-base text-ccd-ink/60 md:text-lg">
              O Studio lê os números públicos do seu canal no YouTube e traduz em português claro: o que funciona, o que
              não funciona e o que fazer em seguida. Essas leituras também deixam as gerações mais certeiras.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {ANALYSES.map((a, i) => (
              <Reveal key={a.title} index={i}>
                <div className="flex h-full gap-4 rounded-2xl border border-ccd-border bg-white p-4 shadow-lp-card md:p-5">
                  <IconCapsule icon={a.icon} gold={a.icon === Mic01Icon} />
                  <div>
                    <h3 className="text-sm font-semibold text-ccd-ink">{a.title}</h3>
                    <p className="mt-1 text-xs text-ccd-ink/60">{a.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal direction="right">
          <HudPanel />
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- Como funciona (radial navy) */

const STEPS: { icon: IconSvgElement; figure: Figure; label: string; title: string; text: string }[] = [
  {
    icon: GoogleIcon,
    figure: Padlock,
    label: "Um cadeado que se abre quando o cursor se aproxima",
    title: "Entre com o Google",
    text: "Use a conta Google liberada para você pela AM Educação.",
  },
  {
    icon: YoutubeIcon,
    figure: Plug,
    label: "Um plugue que sobe em direção à tomada conforme o cursor",
    title: "Conecte o seu canal",
    text: "Com um clique o Studio passa a enxergar os dados do seu canal.",
  },
  {
    icon: SparklesIcon,
    figure: Hub,
    label: "Uma central ligada a oito blocos; o bloco sob o cursor sobe e a ligação se acende",
    title: "Responda e gere",
    text: "Escolha a ferramenta, responda poucas perguntas e acompanhe a IA trabalhando.",
  },
  {
    icon: Clock01Icon,
    figure: Cabinet,
    label: "Um arquivo de gavetas que saem conforme a altura do cursor",
    title: "Use e guarde",
    text: "Copie o resultado para o YouTube. Tudo fica salvo no seu histórico.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className={cn(SECTION, "lp-radial-navy")}>
      <div aria-hidden className="absolute inset-0 lp-grid" />
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading
            dark
            badge="Como funciona"
            title="Do zero ao vídeo otimizado em quatro passos"
            description="Sem configuração complicada: em poucos minutos você já tem o primeiro resultado em mãos."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const FigureEl = step.figure
            return (
              <Reveal key={step.title} index={i} className="h-full">
                <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-ccd-navy shadow-lp-panel transition-colors duration-300 hover:border-ccd-teal/40">
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 font-mono text-[10px] tracking-[0.25em] text-white/45 uppercase">
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-ccd-gold-light" />
                      Passo
                    </span>
                    <span className="text-ccd-gold-light">{String(i + 1).padStart(2, "0")} / 04</span>
                  </div>
                  <div className="hairline-ccd-dark border-b border-white/10 bg-ccd-navy">
                    <FigureEl theme="dark" intensity={0.65} play label={step.label} className="w-full" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                      <HugeiconsIcon icon={step.icon} strokeWidth={1.8} className="size-5 text-ccd-teal-light" />
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-white/60">{step.text}</p>
                  </div>
                </article>
              </Reveal>
            )
          })}
        </div>

        {/* linha de progresso teal → dourado */}
        <div aria-hidden className="mx-auto mt-10 hidden h-px max-w-4xl bg-linear-to-r from-transparent via-ccd-teal-light to-ccd-gold lg:block" />
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- Créditos (mist) */

export function CreditsSection() {
  const stats = [
    { value: creditsLabel(FEATURE_COSTS.metadata), label: "por otimização de vídeo" },
    { value: creditsLabel(FEATURE_COSTS.script), label: "por roteiro" },
    { value: "Grátis", label: "aprender o seu jeito de falar" },
  ]
  const chips = [
    { icon: Coins01Icon, label: "Créditos gratuitos todo mês" },
    { icon: Clock01Icon, label: "Saldo e extrato sempre à vista" },
    { icon: ListViewIcon, label: "Histórico de todas as gerações" },
  ]
  return (
    <section id="creditos" className={cn(SECTION, "bg-ccd-mist")}>
      <div aria-hidden className="absolute inset-0 lp-glows-soft" />
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading
            badge="Créditos"
            title="Você só gasta quando gera"
            description="Cada geração com IA usa créditos. O custo aparece no botão antes de você confirmar, e o seu plano renova créditos gratuitos todo mês."
          />
        </Reveal>

        <Reveal className="mx-auto mt-12 max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-8 rounded-3xl bg-linear-to-r from-ccd-navy to-ccd-teal p-8 text-white md:flex-row md:p-10">
            <dl className="grid w-full grid-cols-1 gap-6 text-center sm:grid-cols-3 md:text-left">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-3xl font-bold tabular-nums first-letter:uppercase md:text-4xl">{s.value}</dd>
                  <dd className="mt-1 text-xs text-white/70 md:text-sm">{s.label}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/login"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-ccd-navy transition-colors hover:bg-white/90"
            >
              Ver meu saldo
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
            </Link>
          </div>
        </Reveal>

        <Reveal className="mt-8">
          <ul className="flex flex-wrap justify-center gap-3">
            {chips.map((c) => (
              <li
                key={c.label}
                className="inline-flex items-center gap-2 rounded-full border border-ccd-border bg-white px-4 py-2 text-sm text-ccd-ink/80"
              >
                <HugeiconsIcon icon={c.icon} strokeWidth={2} className="size-4 text-ccd-teal" />
                {c.label}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- Dúvidas (branco) */

const FAQ = [
  {
    q: "O que é o CCD Studio?",
    a: "É a ferramenta da AM Educação que ajuda você a criar conteúdo para o YouTube. Ela analisa o seu canal e usa inteligência artificial para escrever títulos, descrições, tags e roteiros prontos para usar.",
  },
  {
    q: "Quem pode usar?",
    a: "Quem tem acesso liberado pela AM Educação. Você entra com a sua conta Google; se aparecer que não há conta, peça acesso ao administrador.",
  },
  {
    q: "Preciso conectar o meu canal do YouTube?",
    a: "Para as análises, sim: elas precisam dos números do canal. Conectar também melhora as gerações, porque a IA passa a conhecer o seu público e o seu jeito de falar.",
  },
  {
    q: "O que são créditos?",
    a: "São a moeda das gerações com IA. Cada ferramenta mostra quanto custa antes de você confirmar, e o seu plano recebe créditos gratuitos todo mês. O saldo e o extrato ficam em “Planos e créditos”.",
  },
  {
    q: "Posso publicar o texto exatamente como a IA entregou?",
    a: "Pode, mas vale sempre ler antes. A IA acerta muito, mas você conhece o seu vídeo melhor do que ninguém — ajuste o que for preciso.",
  },
  {
    q: "Os meus dados ficam seguros?",
    a: "O Studio só lê os dados do canal que você autoriza e não publica nada por você. Os detalhes estão na política de privacidade.",
  },
]

export function FaqSection() {
  return (
    <section id="duvidas" className={cn(SECTION, "bg-white")}>
      <div className={cn(CONTAINER, "max-w-3xl")}>
        <Reveal>
          <div className="hairline-ccd-light mx-auto -mb-2 w-44 md:w-52">
            <Query theme="light" intensity={0.75} play label="Um ponto de interrogação que gira em direção ao cursor" />
          </div>
          <SectionHeading badge="Dúvidas" title="Perguntas frequentes" />
        </Reveal>
        <Reveal className="mt-12">
          <div className="border-t border-ccd-border">
            {FAQ.map((item, i) => (
              <details key={item.q} open={i === 0} className="group border-b border-ccd-border">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold text-ccd-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    strokeWidth={2}
                    className="size-5 shrink-0 text-ccd-teal transition-transform duration-300 group-open:rotate-180"
                  />
                </summary>
                <p className="pb-5 text-sm text-ccd-ink/70">{item.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
        <p className="mt-8 text-center text-sm text-ccd-ink/60">
          Quer saber mais?{" "}
          <Link href="/privacidade" className="font-semibold text-ccd-teal hover:text-ccd-gold">
            Leia a política de privacidade
          </Link>{" "}
          ou{" "}
          <Link href="/termos" className="font-semibold text-ccd-teal hover:text-ccd-gold">
            os termos de uso
          </Link>
          .
        </p>
      </div>
    </section>
  )
}
