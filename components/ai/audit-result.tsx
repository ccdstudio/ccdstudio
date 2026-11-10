import type { z } from "zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import type { auditOutputSchema } from "@/lib/ai/prompts/audit"
import { creditsLabel } from "@/lib/credits/costs"
import { CHECK_ICON } from "@/lib/status-colors"
import { cn } from "@/lib/utils"

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })

type Props = { output: z.infer<typeof auditOutputSchema>; createdAt: string; credits: number }

/** Resultado do diagnóstico por IA (usado no Diagnóstico do canal e no Histórico). */
export function AuditResult({ output, createdAt, credits }: Props) {
  return (
    <section className="flex flex-col gap-5 rounded-xl border border-primary/40 bg-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="label">A UMA coisa para corrigir primeiro</span>
        <span className="text-xs text-muted-foreground">
          {dateTime.format(new Date(createdAt))} · {creditsLabel(credits)}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{output.correcao_principal.titulo}</h2>
        <p className="text-sm text-muted-foreground">{output.correcao_principal.por_que}</p>
        <p className="rounded-lg bg-primary/10 p-3 text-sm">
          <strong className="font-semibold">Esta semana:</strong> {output.correcao_principal.esta_semana}
        </p>
      </div>
      <div className="grid gap-5 border-t border-border pt-5 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="label">Já funciona (não quebre)</span>
          <ul className="flex flex-col gap-2 text-sm">
            {output.funcionando.map((f) => (
              <li key={f} className="flex gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.75} className={cn("mt-0.5 size-4 shrink-0", CHECK_ICON.ok)} />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <span className="label">Não faça ainda</span>
          <ul className="flex flex-col gap-2 text-sm">
            {output.nao_fazer_agora.map((n) => (
              <li key={n.o_que} className="flex gap-2">
                <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={1.75} className={cn("mt-0.5 size-4 shrink-0", CHECK_ICON.warn)} />
                <span>
                  <strong className="font-semibold">{n.o_que}.</strong> <span className="text-muted-foreground">{n.por_que}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {output.miniaturas ? (
        <div className="flex flex-col gap-2 border-t border-border pt-5">
          <span className="label">Miniaturas no feed</span>
          <p className="text-sm">{output.miniaturas.legiveis_no_feed}</p>
          {output.miniaturas.problemas.length ? (
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {output.miniaturas.problemas.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">Gerado por IA a partir dos dados públicos. Revise antes de mudar o canal.</p>
    </section>
  )
}
