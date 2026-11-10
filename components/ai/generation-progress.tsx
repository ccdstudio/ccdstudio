"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { AgentWaveLoader } from "@/components/ui/agent-wave-loader"
import { OutcomeSpinnerLoader, type SpinnerStatus } from "@/components/ui/outcome-spinner-loader"
import { cn } from "@/lib/utils"

export type GenerationStatus = "running" | "success" | "error"

type Props = {
  status: GenerationStatus
  /** Fases mostradas em sequência (só ilustrativas: a IA gera tudo de uma vez). */
  phases: string[]
  estimatedMs: number
  message?: string | null
  onRetry: () => void
}

/**
 * Tela enquanto a IA trabalha: loader animado + checklist das fases. As fases avançam pelo tempo estimado; a última
 * só fecha quando o servidor responde. No erro, mostra a mensagem e volta para a revisão sem perder os dados.
 */
export function GenerationProgress({ status, phases, estimatedMs, message, onRetry }: Props) {
  const reduced = useReducedMotion()
  const [done, setDone] = useState(0)

  useEffect(() => {
    if (status !== "running") return
    const step = estimatedMs / phases.length
    // Nunca fecha a última fase sozinho: ela espera a resposta.
    const timers = phases.slice(0, -1).map((_, i) => window.setTimeout(() => setDone((d) => Math.max(d, i + 1)), step * (i + 1)))
    return () => timers.forEach(window.clearTimeout)
  }, [status, estimatedMs, phases])

  const finished = status === "success" ? phases.length : done
  const phaseStatus = (i: number): SpinnerStatus => {
    if (i < finished) return "success"
    if (i === finished) return status === "error" ? "error" : "pending"
    return "idle"
  }
  const current = status === "success" ? "Pronto! Abrindo o resultado…" : status === "error" ? "Não deu certo" : phases[Math.min(done, phases.length - 1)]

  return (
    <motion.section
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 rounded-2xl border border-border bg-card px-6 py-12 text-center sm:px-10"
    >
      {status === "running" ? (
        // `zoom` (e não `scale`) aumenta o loader ocupando o espaço certo no layout, sem cortar a animação.
        // O texto do loader fica só para leitores de tela: a frase já aparece grande logo abaixo.
        <div className="[zoom:1.75] sm:[zoom:2.25]">
          <AgentWaveLoader label={`${current}…`} className="[&_.agent-wave-label]:sr-only" />
        </div>
      ) : (
        <OutcomeSpinnerLoader status={status} size="lg" label={current} />
      )}

      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-[-0.03em]">{current}</h2>
        {status === "running" ? (
          <p className="text-sm text-muted-foreground">
            Pode levar até {Math.ceil((estimatedMs * 1.6) / 60000)} min. Se você sair desta tela, o resultado fica guardado no
            Histórico.
          </p>
        ) : null}
        {status === "error" && message ? <p className="text-sm text-destructive">{message}</p> : null}
      </div>

      <ol className="flex w-full max-w-md flex-col gap-3 text-left">
        {phases.map((p, i) => (
          <motion.li
            key={p}
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduced ? 0 : i * 0.06 }}
            className={cn("flex items-center gap-3 text-sm", phaseStatus(i) === "idle" && "text-muted-foreground")}
          >
            <OutcomeSpinnerLoader status={phaseStatus(i)} size="sm" tone="primary" label={p} />
            <span className={cn(phaseStatus(i) === "pending" && "font-semibold")}>{p}</span>
          </motion.li>
        ))}
      </ol>

      {status === "error" ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.75} data-icon="inline-start" />
          Voltar e tentar de novo
        </Button>
      ) : null}
    </motion.section>
  )
}
