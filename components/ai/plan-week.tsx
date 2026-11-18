import { Badge } from "@/components/ui/badge"
import { dayIndex, formatDay, formatHours, PLAN_FORMATS, weekDates, type PlanOutput } from "@/lib/ai/prompts/plan"
import { PLAN_FORMAT_TONE } from "@/lib/status-colors"
import { cn } from "@/lib/utils"

/**
 * A semana do plano em 7 colunas (segunda a domingo, com as datas). Dias sem nada ficam vazios de propósito:
 * a skill reserva folga para a semana sobreviver a um imprevisto. No celular vira uma lista só com os dias usados.
 */
export function PlanWeek({ output, start, compact = false }: { output: PlanOutput; start: string; compact?: boolean }) {
  const days = weekDates(start)
  const byDay = (d: string) => output.itens.filter((i) => i.dia === d).sort((a, b) => order(a.formato) - order(b.formato))

  return (
    <ol className="grid gap-2 md:grid-cols-7" aria-label="Semana do plano, de segunda a domingo">
      {days.map(({ day, date }) => {
        const items = byDay(day)
        return (
          <li
            key={day}
            className={cn(
              "flex min-w-0 flex-col gap-2 rounded-xl border p-2.5",
              items.length ? "border-border bg-card" : "hidden border-dashed border-border/70 md:flex"
            )}
          >
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-sm font-semibold capitalize">{day}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{formatDay(date)}</span>
            </div>
            {items.length ? (
              items.map((i, n) => (
                <div key={`${i.formato}-${n}`} className="flex flex-col gap-1">
                  <Badge variant="outline" className={cn("w-fit", PLAN_FORMAT_TONE[i.formato])}>
                    {PLAN_FORMATS[i.formato]} · {formatHours(i.horas)}
                  </Badge>
                  <p className={cn("text-xs leading-snug font-medium", compact && "line-clamp-2")}>{i.titulo}</p>
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">folga</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

const order = (f: keyof typeof PLAN_FORMATS) => ({ principal: 0, simples: 1, short: 2 })[f]

/** Itens do plano na ordem da semana (para a tabela). */
export const sortedItems = (o: PlanOutput) => [...o.itens].sort((a, b) => dayIndex(a.dia) - dayIndex(b.dia) || order(a.formato) - order(b.formato))
