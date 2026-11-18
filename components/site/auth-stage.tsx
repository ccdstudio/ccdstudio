"use client"

import type { ReactNode } from "react"
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mic01Icon, Tag01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { StudioLogo } from "./studio-logo"

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const EASE_WORDS = [0.16, 1, 0.3, 1] as const

/** Fundo das telas de acesso: grid técnico + brilhos teal/dourado que seguem o mouse e flutuam. */
export function AuthBackdrop({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 50, damping: 20 })
  const sy = useSpring(my, { stiffness: 50, damping: 20 })
  const tealX = useTransform(sx, (v) => v * 60)
  const tealY = useTransform(sy, (v) => v * 60)
  const goldX = useTransform(sx, (v) => v * -45)
  const goldY = useTransform(sy, (v) => v * -45)

  const glows = [
    { x: tealX, y: tealY, cls: "-top-48 -left-48 lp-orb-teal", delay: 0 },
    { x: goldX, y: goldY, cls: "-right-48 -bottom-56 lp-orb-gold", delay: 1.5 },
  ]

  return (
    <div
      className="relative flex min-h-svh flex-1 overflow-hidden bg-ccd-navy-darker"
      onPointerMove={(e) => {
        if (reduced || e.pointerType !== "mouse") return
        mx.set((e.clientX / window.innerWidth) * 2 - 1)
        my.set((e.clientY / window.innerHeight) * 2 - 1)
      }}
    >
      <div aria-hidden className="absolute inset-0 lp-grid" />
      {glows.map((g, i) => (
        // Externo: segue o mouse. Interno: flutua. (um dono por elemento)
        <motion.div
          key={i}
          aria-hidden
          style={{ x: g.x, y: g.y }}
          className={cn("pointer-events-none absolute size-[40rem]", g.cls)}
        >
          <motion.div
            className="size-full"
            animate={reduced ? undefined : { y: [0, -24, 0] }}
            transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity, delay: g.delay }}
          />
        </motion.div>
      ))}
      {children}
    </div>
  )
}

/** Entrada do cartão do formulário: sobe e aparece. */
export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 28, scale: reduced ? 1 : 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

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
            transition={{ duration: 0.9, ease: EASE_WORDS, delay: delay + i * 0.05 }}
          >
            {word}
          </motion.span>
          {" "}
        </span>
      ))}
    </>
  )
}

function Chip({
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
      transition={{ duration: 0.6, ease: EASE_OUT, delay }}
      className={cn("absolute", className)}
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

/** Painel da marca (desktop): logo em linha que se desenha e balança com o cursor + frase curta. */
export function AuthShowcase() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-full max-w-sm">
        <StudioLogo mode="interactive" delay={0.3} title="" className="w-full text-white" />
        <Chip className="-top-6 -left-4" delay={1.4} float={0}>
          <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="size-3.5 text-ccd-teal" />
          Tags prontas
        </Chip>
        <Chip className="-right-6 -bottom-8" delay={1.6} float={1.3} gold>
          <HugeiconsIcon icon={Mic01Icon} strokeWidth={2} className="size-3.5" />
          No seu jeito de falar
        </Chip>
      </div>
      <p className="mt-16 text-4xl leading-[1.15] font-bold text-white xl:text-5xl">
        <Words text="Você grava." delay={0.5} />
        <br />
        <Words text="O" delay={0.7} />
        <span className="whitespace-nowrap">
          <Words text="CCD Studio" delay={0.75} className="text-gradient-gold" />
        </span>
        <br />
        <Words text="escreve o resto." delay={0.85} />
      </p>
    </div>
  )
}
