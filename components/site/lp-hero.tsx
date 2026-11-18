"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react"
import { Phosphor } from "@lucasmarkes/hairline/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Copy01Icon, Mic01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { INTRO_DELAY } from "./lp-intro"

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const EASE_WORDS = [0.16, 1, 0.3, 1] as const

/* ------------------------------------------------------------------ roteiro da demonstração */

// Exemplos ilustrativos do que a Otimização de vídeo entrega (não são dados reais).
const EXAMPLES = [
  {
    length: "08:30",
    title: "Como abrir MEI em 2026: passo a passo sem erro",
    description: [
      "Neste vídeo eu mostro, do zero, como abrir o seu MEI pelo portal oficial.",
      "Você vai ver os documentos, as atividades permitidas e os erros mais comuns.",
      "00:00 Introdução · 01:20 Quem pode ser MEI · 04:05 Passo a passo",
    ],
    tags: ["mei", "abrir mei", "mei 2026", "empreendedor", "contabilidade"],
  },
  {
    length: "12:05",
    title: "5 despesas que você pode deduzir no Imposto de Renda",
    description: [
      "Muita gente paga mais imposto do que deveria por esquecer estas despesas.",
      "Eu explico cada uma, quem pode usar e quais comprovantes guardar.",
      "00:00 Abertura · 00:50 Saúde · 03:10 Educação · 06:40 Previdência",
    ],
    tags: ["imposto de renda", "irpf", "dedução", "declaração", "contador"],
  },
  {
    length: "10:42",
    title: "Simples Nacional ou Lucro Presumido? Faça a conta certa",
    description: [
      "Escolher o regime errado pode custar caro para a sua empresa.",
      "Comparo os dois com um exemplo de faturamento e mostro a conta.",
      "00:00 O problema · 02:15 Simples · 05:30 Presumido · 08:50 Veredito",
    ],
    tags: ["simples nacional", "lucro presumido", "regime tributário", "empresa"],
  },
]

type Phase = "title" | "description" | "tags" | "done"

/**
 * Relógio da demonstração: avança um "passo" por vez (letra do título, linha da descrição, tag)
 * e, no fim, segura o resultado e passa para o próximo exemplo. Com reduced-motion mostra tudo pronto.
 */
function useDemo(reduced: boolean | null) {
  const [ex, setEx] = useState(0)
  const [step, setStep] = useState(0)
  const first = useRef(true)
  const e = EXAMPLES[ex]
  const T = e.title.length
  const D = e.description.length
  const G = e.tags.length
  const last = T + D + G

  useEffect(() => {
    if (reduced) return
    const delay = step === 0 ? (first.current ? (INTRO_DELAY + 1.6) * 1000 : 700) : step < T ? 28 : step < T + D ? 480 : step < last ? 170 : 3200
    const timer = setTimeout(() => {
      first.current = false
      if (step < last) setStep((s) => s + 1)
      else {
        setEx((v) => (v + 1) % EXAMPLES.length)
        setStep(0)
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [step, T, D, last, reduced])

  const s = reduced ? last : step
  const phase: Phase = s < T ? "title" : s < T + D ? "description" : s < last ? "tags" : "done"
  return {
    ex,
    example: e,
    phase,
    title: e.title.slice(0, Math.min(s, T)),
    lines: Math.max(0, Math.min(s - T, D)),
    tags: Math.max(0, Math.min(s - T - D, G)),
  }
}

const STATUS: Record<Phase, string> = {
  title: "Escrevendo o título…",
  description: "Escrevendo a descrição…",
  tags: "Escolhendo as tags…",
  done: "Pronto para publicar",
}

/* ------------------------------------------------------------------ peças */

function Words({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className={cn("inline-block", className)}
            initial={reduced ? { opacity: 0 } : { y: "110%" }}
            animate={reduced ? { opacity: 1 } : { y: "0%" }}
            transition={{ duration: 0.9, ease: EASE_WORDS, delay: (reduced ? 0 : INTRO_DELAY) + delay + i * 0.05 }}
          >
            {word}
          </motion.span>
          {" "}
        </span>
      ))}
    </>
  )
}

function Field({ label, children, active }: { label: string; children: ReactNode; active: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-white/45 uppercase">
        {label}
        {active && <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-ccd-teal-light" />}
      </div>
      <div
        className={cn(
          "mt-1.5 rounded-xl border bg-white/5 p-3 transition-colors duration-300",
          active ? "border-ccd-teal/50" : "border-white/10",
        )}
      >
        {children}
      </div>
    </div>
  )
}

function Caret() {
  return (
    <span aria-hidden className="lp-caret ml-0.5 inline-block h-[1.05em] w-0.5 translate-y-[0.15em] bg-ccd-teal-light" />
  )
}

/* ------------------------------------------------------------------ o "palco": um vídeo sendo preenchido */

function DemoStage() {
  const reduced = useReducedMotion()
  const { ex, example, phase, title, lines, tags } = useDemo(reduced)
  const checks = [
    { label: "Título", done: phase !== "title" },
    { label: "Descrição", done: phase === "tags" || phase === "done" },
    { label: "Tags", done: phase === "done" },
  ]

  return (
    <div
      aria-label="Demonstração: o CCD Studio preenchendo título, descrição e tags de um vídeo"
      role="img"
      className="rounded-[2rem] border border-white/10 bg-ccd-navy p-2 shadow-lp-panel md:p-3"
    >
      {/* barra HUD */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 font-mono text-[10px] tracking-[0.25em] text-white/45 uppercase md:px-4">
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-ccd-gold-light" />
          <span className="hidden sm:inline">CCD Studio ·</span> Otimização
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "flex items-center gap-1.5",
              phase === "done" ? "text-ccd-gold-light" : "text-ccd-teal-light/80",
            )}
          >
            {phase === "done" && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3" />}
            {STATUS[phase]}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-ccd-navy-darker p-3 text-left md:grid-cols-5 md:gap-5 md:p-5">
        {/* vídeo gravado */}
        <div className="flex flex-col gap-3 md:col-span-2">
          <div className="hairline-ccd-darker relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-ccd-navy-darker">
            <div className="w-[46%]">
              <Phosphor theme="dark" intensity={0.7} label="Tela de vídeo em matriz de pontos tocando" />
            </div>
            <span className="absolute top-2.5 left-2.5 rounded-full bg-ccd-navy/85 px-2 py-0.5 font-mono text-[9px] tracking-widest text-white/70 uppercase">
              Seu vídeo
            </span>
            <span className="absolute right-2.5 bottom-2.5 rounded-md bg-ccd-navy/85 px-1.5 py-0.5 font-mono text-[10px] text-white/80 tabular-nums">
              {example.length}
            </span>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
              <motion.div
                className="h-full origin-left bg-ccd-teal-light"
                initial={{ scaleX: reduced ? 0.4 : 0 }}
                animate={reduced ? undefined : { scaleX: [0, 1] }}
                transition={{ duration: 14, ease: "linear", repeat: Infinity }}
              />
            </div>
          </div>

          {/* checklist sincronizado com a geração */}
          <ul className="grid grid-cols-3 gap-2">
            {checks.map((c) => (
              <li
                key={c.label}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-full border px-2 py-1.5 text-[11px] font-semibold transition-colors duration-300",
                  c.done ? "border-ccd-teal/40 bg-ccd-teal/15 text-ccd-teal-light" : "border-white/10 text-white/40",
                )}
              >
                <motion.span
                  animate={{ scale: c.done ? 1 : 0.6, opacity: c.done ? 1 : 0.4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="flex"
                >
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3" />
                </motion.span>
                {c.label}
              </li>
            ))}
          </ul>
        </div>

        {/* campos que a IA preenche */}
        <div className="flex flex-col gap-3 md:col-span-3">
          <Field label="Título" active={phase === "title"}>
            <p className="min-h-[2.75rem] text-sm font-semibold text-white md:text-base">
              {title}
              {phase === "title" && <Caret />}
            </p>
          </Field>

          <Field label="Descrição" active={phase === "description"}>
            <div className="flex min-h-[4.5rem] flex-col gap-1.5">
              {example.description.map((line, i) =>
                i < lines ? (
                  <motion.p
                    key={`${ex}-${i}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EASE_OUT }}
                    className="text-xs leading-relaxed text-white/70"
                  >
                    {line}
                  </motion.p>
                ) : (
                  <span
                    key={`${ex}-${i}-sk`}
                    className={cn(
                      "my-1 h-2.5 rounded-full bg-white/10",
                      i === 2 ? "w-2/3" : "w-full",
                      phase === "description" && i === lines && "animate-pulse",
                    )}
                  />
                ),
              )}
            </div>
          </Field>

          <Field label="Tags" active={phase === "tags"}>
            <div className="flex min-h-[1.75rem] flex-wrap gap-1.5">
              {example.tags.slice(0, tags).map((tag) => (
                <motion.span
                  key={`${ex}-${tag}`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="rounded-full border border-ccd-teal/30 bg-ccd-teal/10 px-2.5 py-1 text-[11px] font-medium text-ccd-teal-light"
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </Field>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ brilhos e selos */

function Glow({
  className,
  mx,
  my,
  depth,
  float,
}: {
  className: string
  mx: MotionValue<number>
  my: MotionValue<number>
  depth: number
  float: number
}) {
  const reduced = useReducedMotion()
  const x = useTransform(mx, (v) => v * depth)
  const y = useTransform(my, (v) => v * depth)
  return (
    <motion.div aria-hidden style={{ x, y }} className={cn("pointer-events-none absolute", className)}>
      <motion.div
        className="size-full"
        animate={reduced ? undefined : { y: [0, -22, 0] }}
        transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity, delay: float }}
      />
    </motion.div>
  )
}

function FloatingChip({
  children,
  className,
  delay,
  float,
  gold = false,
}: {
  children: ReactNode
  className: string
  delay: number
  float: number
  gold?: boolean
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: (reduced ? 0 : INTRO_DELAY) + delay }}
      className={cn("absolute z-10 hidden md:block", className)}
    >
      <motion.span
        animate={reduced ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 4.2, ease: "easeInOut", repeat: Infinity, delay: float }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-ccd-navy shadow-lg",
          gold ? "bg-linear-to-r from-ccd-gold to-ccd-gold-light" : "bg-white",
        )}
      >
        {children}
      </motion.span>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ hero */

export function LpHero() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  // Mouse normalizado (-1…1) com mola: alimenta os brilhos e a inclinação do palco.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 20 })
  const sy = useSpring(my, { stiffness: 60, damping: 20 })
  const tiltX = useTransform(sy, (v) => v * -3)
  const tiltY = useTransform(sx, (v) => v * 4)

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    if (reduced || e.pointerType !== "mouse") return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1)
    my.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }
  function onPointerLeave() {
    mx.set(0)
    my.set(0)
  }

  // Scroll: o texto sobe e esmaece; o palco cresce um pouco enquanto chega ao centro.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -80])
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, reduced ? 1 : 0])
  const stageScale = useTransform(scrollYProgress, [0, 0.5], [1, reduced ? 1 : 1.04])

  const item = (i: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: EASE_OUT, delay: (reduced ? 0 : INTRO_DELAY) + 0.55 + i * 0.08 },
  })

  return (
    <section
      ref={ref}
      id="inicio"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative scroll-mt-24 overflow-hidden bg-ccd-navy"
    >
      <div aria-hidden className="absolute inset-0 lp-grid" />
      <Glow mx={sx} my={sy} depth={60} float={0} className="-top-40 -left-40 size-[36rem] lp-orb-teal" />
      <Glow mx={sx} my={sy} depth={-45} float={1.5} className="top-1/3 -right-40 size-[36rem] lp-orb-gold" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-b from-transparent to-ccd-navy-darker" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-32 pb-20 text-center md:px-8 md:pt-36 md:pb-28">
        <motion.div style={{ y: textY, opacity: textOpacity }} className="flex flex-col items-center">
          <h1 className="max-w-5xl text-4xl leading-[1.1] font-bold text-white sm:text-5xl md:text-6xl">
            <Words text="Você grava." />
            <br />
            <Words text="O" delay={0.25} />
            <span className="whitespace-nowrap">
              <Words text="CCD Studio" delay={0.3} className="text-gradient-gold" />
            </span>
            <Words text="escreve o resto." delay={0.4} />
          </h1>

          <motion.p {...item(0)} className="mt-5 text-base text-white/60 md:text-lg">
            Título, descrição e tags com IA — no seu jeito de falar.
          </motion.p>

          <motion.div {...item(1)} className="mt-8">
            <Link
              href="/login"
              className="group inline-flex h-12 items-center gap-2 rounded-xl bg-linear-to-r from-ccd-teal to-ccd-teal-light px-7 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Acessar o Studio
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="size-4 transition-transform group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </motion.div>

        {/* palco: externo = scroll, meio = inclinação do mouse, interno = entrada (um dono por elemento) */}
        <motion.div style={{ scale: stageScale }} className="relative mt-14 w-full max-w-5xl md:mt-16">
          <motion.div style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1400 }}>
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 60, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.1, ease: EASE_OUT, delay: (reduced ? 0 : INTRO_DELAY) + 0.6 }}
              className="relative"
            >
              <DemoStage />
              <FloatingChip className="-top-4 -left-6" delay={1.5} float={0} gold>
                <HugeiconsIcon icon={Mic01Icon} strokeWidth={2} className="size-3.5" />
                No seu jeito de falar
              </FloatingChip>
              <FloatingChip className="-right-6 -bottom-4" delay={1.7} float={1.3}>
                <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5 text-ccd-teal" />
                Copie e cole no YouTube
              </FloatingChip>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
