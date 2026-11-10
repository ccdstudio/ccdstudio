"use client"

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { z } from "zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon, Edit02Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { GenerationProgress, type GenerationStatus } from "./generation-progress"

// Formulário em etapas das gerações com IA (uma pergunta por tela) + tela de geração animada.
// Usado por Otimização de vídeo e Roteiro. Os dados ficam no estado; o envio chama a server action com um objeto.

export type WizardStep = {
  name: string
  /** Pergunta grande, em linguagem simples. */
  question: string
  help?: string
  kind: "text" | "textarea" | "choice"
  placeholder?: string
  /** Chips que preenchem o campo com um clique. */
  suggestions?: string[]
  /** Cards de escolha (kind "choice"). */
  options?: { value: string; label: string; hint?: string }[]
  /** Rótulo curto na revisão. */
  reviewLabel: string
  /** Como mostrar o valor na revisão (ex.: "8 minutos"). */
  format?: (value: string) => string
}

/** Campo editável só na revisão (ex.: nicho). */
export type ReviewField = { name: string; label: string; hint?: string }

export type WizardResult = { id?: string; message?: string; fieldErrors?: Record<string, string[] | undefined> }

type Props = {
  steps: WizardStep[]
  reviewFields?: ReviewField[]
  initial: Record<string, string>
  schema: z.ZodObject<z.ZodRawShape>
  /** Ex.: "1 crédito". */
  cost: string
  submitLabel: string
  /** Motivo para não deixar gerar (sem créditos, IA não configurada). */
  blocked?: string | null
  /** Começa direto na revisão (ex.: veio pré-preenchido de outra página). */
  startAtReview?: boolean
  submit: (values: Record<string, string>) => Promise<WizardResult>
  phases: string[]
  /** Tempo estimado da geração, para avançar as fases. */
  estimatedMs: number
  resultHref: (id: string) => string
}

const fieldClass =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 sm:text-lg"

function fieldError(schema: Props["schema"], name: string, value: string): string | null {
  const shape = schema.shape[name] as z.ZodType | undefined
  if (!shape) return null
  const r = shape.safeParse(value)
  return r.success ? null : (r.error.issues[0]?.message ?? "Confira este campo")
}

export function StepWizard(props: Props) {
  const { steps, reviewFields = [], schema, phases } = props
  const router = useRouter()
  const reduced = useReducedMotion()
  const total = steps.length + 1 // + revisão
  const [index, setIndex] = useState(props.startAtReview ? steps.length : 0)
  const [direction, setDirection] = useState(1)
  const [values, setValues] = useState<Record<string, string>>(props.initial)
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [status, setStatus] = useState<GenerationStatus | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const shouldReset = useRef(false)
  // Em ref: o cleanup abaixo só pode rodar quando a tela é escondida, não a cada render do pai.
  const initialRef = useRef({ values: props.initial, index: props.startAtReview ? steps.length : 0 })

  // Com Cache Components o Next esconde a página (<Activity>) em vez de desmontar, e o estado sobrevive.
  // Depois de uma geração concluída, ao sair da tela, zera tudo: "Nova otimização" sempre começa do zero.
  // (docs: node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md)
  useLayoutEffect(() => {
    return () => {
      if (!shouldReset.current) return
      shouldReset.current = false
      setStatus(null)
      setMessage(null)
      setErrors({})
      setValues(initialRef.current.values)
      setDirection(1)
      setIndex(initialRef.current.index)
    }
  }, [])

  const isReview = index === steps.length
  const step = steps[index]

  useEffect(() => {
    // Foco no campo de cada etapa (depois da animação de entrada começar).
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => window.clearTimeout(t)
  }, [index])

  function go(to: number) {
    setDirection(to > index ? 1 : -1)
    setIndex(to)
  }

  function set(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: null }))
  }

  function next() {
    if (!step) return
    const err = fieldError(schema, step.name, values[step.name] ?? "")
    if (err) {
      setErrors((e) => ({ ...e, [step.name]: err }))
      return
    }
    go(index + 1)
  }

  function generate() {
    // Revalida tudo antes de gastar crédito.
    const all: Record<string, string | null> = {}
    for (const name of [...steps.map((s) => s.name), ...reviewFields.map((f) => f.name)]) {
      all[name] = fieldError(schema, name, values[name] ?? "")
    }
    const firstBad = steps.findIndex((s) => all[s.name])
    setErrors(all)
    if (firstBad >= 0) return go(firstBad)
    if (reviewFields.some((f) => all[f.name])) return

    setMessage(null)
    setStatus("running")
    startTransition(async () => {
      let result: WizardResult
      try {
        result = await props.submit(values)
      } catch {
        result = { message: "Não foi possível gerar agora. Tente novamente; nenhum crédito foi cobrado." }
      }
      if (result.id) {
        const id = result.id
        setStatus("success")
        shouldReset.current = true
        // Deixa o ✓ aparecer e leva para o resultado (navegação sem recarregar).
        window.setTimeout(() => router.push(props.resultHref(id)), 900)
        return
      }
      if (result.fieldErrors) {
        const fe = Object.fromEntries(Object.entries(result.fieldErrors).map(([k, v]) => [k, v?.[0] ?? null]))
        setErrors(fe)
        const bad = steps.findIndex((s) => fe[s.name])
        setStatus(null)
        go(bad >= 0 ? bad : steps.length)
        return
      }
      setMessage(result.message ?? "Não foi possível gerar agora. Nenhum crédito foi cobrado.")
      setStatus("error")
    })
  }

  if (status) {
    return (
      <GenerationProgress
        status={status}
        phases={phases}
        estimatedMs={props.estimatedMs}
        message={message}
        onRetry={() => {
          setStatus(null)
          go(steps.length)
        }}
      />
    )
  }

  const variants = {
    enter: (d: number) => (reduced ? { opacity: 0 } : { opacity: 0, x: d * 48 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => (reduced ? { opacity: 0 } : { opacity: 0, x: d * -48 }),
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-2xl border border-border bg-card p-6 sm:p-10">
      {/* Progresso */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="label">
            Etapa {index + 1} de {total}
          </span>
          <span>{isReview ? "Revisar e gerar" : step.reviewLabel}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 220, damping: 30 }}
          />
        </div>
      </div>

      <div className="relative min-h-72">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-5"
          >
            {isReview ? (
              <Review {...props} values={values} errors={errors} set={set} go={go} />
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-bold tracking-[-0.03em] sm:text-3xl">{step.question}</h2>
                  {step.help ? <p className="text-sm text-muted-foreground">{step.help}</p> : null}
                </div>

                {step.kind === "choice" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {step.options?.map((o) => {
                      const selected = values[step.name] === o.value
                      return (
                        <motion.button
                          key={o.value}
                          type="button"
                          whileTap={reduced ? undefined : { scale: 0.97 }}
                          onClick={() => {
                            set(step.name, o.value)
                            window.setTimeout(() => go(index + 1), 220)
                          }}
                          aria-pressed={selected}
                          className={cn(
                            "flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                            selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                          )}
                        >
                          <span className="text-lg font-semibold">{o.label}</span>
                          {o.hint ? <span className="text-sm text-muted-foreground">{o.hint}</span> : null}
                        </motion.button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {step.kind === "textarea" ? (
                      <textarea
                        ref={inputRef}
                        rows={3}
                        value={values[step.name] ?? ""}
                        placeholder={step.placeholder}
                        aria-label={step.question}
                        aria-invalid={Boolean(errors[step.name])}
                        onChange={(e) => set(step.name, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            next()
                          }
                        }}
                        className={cn(fieldClass, "resize-none")}
                      />
                    ) : (
                      <input
                        ref={inputRef}
                        value={values[step.name] ?? ""}
                        placeholder={step.placeholder}
                        aria-label={step.question}
                        aria-invalid={Boolean(errors[step.name])}
                        onChange={(e) => set(step.name, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            next()
                          }
                        }}
                        className={fieldClass}
                      />
                    )}
                    {errors[step.name] ? (
                      <p className="text-sm font-medium text-destructive">{errors[step.name]}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Aperte <kbd className="label">Enter</kbd> para continuar
                        {step.kind === "textarea" ? " (Shift+Enter quebra a linha)" : ""}.
                      </p>
                    )}
                  </div>
                )}

                {step.suggestions?.length ? (
                  <div className="flex flex-col gap-2">
                    <span className="label">Sugestões</span>
                    <div className="flex flex-wrap gap-2">
                      {step.suggestions.map((s) => (
                        <Button
                          key={s}
                          type="button"
                          size="sm"
                          variant={values[step.name] === s ? "default" : "outline"}
                          onClick={() => set(step.name, s)}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-5">
        <Button type="button" variant="ghost" onClick={() => go(index - 1)} disabled={index === 0}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.75} data-icon="inline-start" />
          Voltar
        </Button>
        {isReview ? (
          <Button type="button" size="lg" onClick={generate} disabled={Boolean(props.blocked)}>
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={1.75} data-icon="inline-start" />
            {props.submitLabel} · {props.cost}
          </Button>
        ) : step.kind === "choice" ? null : (
          <Button type="button" onClick={next}>
            Continuar
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.75} data-icon="inline-end" />
          </Button>
        )}
      </div>
    </section>
  )
}

function Review({
  steps,
  reviewFields = [],
  values,
  errors,
  set,
  go,
  blocked,
  cost,
}: Props & {
  values: Record<string, string>
  errors: Record<string, string | null>
  set: (name: string, value: string) => void
  go: (to: number) => void
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-[-0.03em] sm:text-3xl">Tudo certo? Confira e gere.</h2>
        <p className="text-sm text-muted-foreground">
          A geração usa {cost} do seu saldo. Se der algum erro, nada é cobrado.
        </p>
      </div>
      <dl className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {steps.map((s, i) => (
          <div key={s.name} className="flex items-start gap-3 px-4 py-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <dt className="label">{s.reviewLabel}</dt>
              <dd className={cn("text-sm break-words", errors[s.name] && "text-destructive")}>
                {values[s.name] ? (s.format ? s.format(values[s.name]) : values[s.name]) : "—"}
                {errors[s.name] ? <span className="block text-xs font-medium">{errors[s.name]}</span> : null}
              </dd>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => go(i)} aria-label={`Editar ${s.reviewLabel}`}>
              <HugeiconsIcon icon={Edit02Icon} strokeWidth={1.75} data-icon="inline-start" />
              Editar
            </Button>
          </div>
        ))}
        {reviewFields.map((f) => (
          <div key={f.name} className="flex flex-col gap-1.5 px-4 py-3">
            <label htmlFor={`revisao-${f.name}`} className="label">
              {f.label}
            </label>
            <input
              id={`revisao-${f.name}`}
              value={values[f.name] ?? ""}
              onChange={(e) => set(f.name, e.target.value)}
              aria-invalid={Boolean(errors[f.name])}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
            {errors[f.name] ? (
              <p className="text-xs font-medium text-destructive">{errors[f.name]}</p>
            ) : f.hint ? (
              <p className="text-xs text-muted-foreground">{f.hint}</p>
            ) : null}
          </div>
        ))}
      </dl>
      {blocked ? <p className="text-sm font-medium text-destructive">{blocked}</p> : null}
    </>
  )
}
