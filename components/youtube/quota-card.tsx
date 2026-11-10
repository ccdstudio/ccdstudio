import { HugeiconsIcon } from "@hugeicons/react"
import { DashboardSpeed01Icon } from "@hugeicons/core-free-icons"
import type { CurrentUser } from "@/lib/auth/dal"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

// Cota diária da YouTube Data API (10.000 unidades por projeto). Só o superadmin vê:
// o componente não renderiza para outros papéis e a RLS de youtube_api_usage também bloqueia.

const DAILY_QUOTA = 10_000
const PACIFIC = "America/Los_Angeles"
const BRASILIA = "America/Sao_Paulo"

const number = new Intl.NumberFormat("pt-BR")
const time = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short", timeZone: BRASILIA })

/** Dia atual no fuso do Pacífico (o "dia" da cota do Google), em YYYY-MM-DD. */
function pacificDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: PACIFIC }).format(now)
}

/** Próxima meia-noite do Pacífico, como instante (para mostrar a hora de Brasília). */
function nextPacificMidnight(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: PACIFIC, hour12: false, hour: "numeric", minute: "numeric", second: "numeric" })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  )
  const elapsed = ((Number(parts.hour) % 24) * 3600 + Number(parts.minute) * 60 + Number(parts.second)) * 1000
  return new Date(now.getTime() - elapsed + 24 * 3600 * 1000)
}

export async function QuotaCard({ user }: { user: CurrentUser }) {
  if (user.role !== "superadmin") return null

  const now = new Date()
  const supabase = await createClient()
  const { data } = await supabase
    .from("youtube_api_usage")
    .select("units_used, requests, updated_at")
    .eq("day", pacificDay(now))
    .maybeSingle()

  const used = data?.units_used ?? 0
  const pct = Math.min(100, (used / DAILY_QUOTA) * 100)
  const high = pct >= 80

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-center gap-3 sm:w-56">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HugeiconsIcon icon={DashboardSpeed01Icon} strokeWidth={1.75} className="size-4" />
        </span>
        <div className="flex flex-col">
          <span className="label">Cota do YouTube hoje</span>
          <span className="text-xs text-muted-foreground">Visível só para o superadmin</span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-heading text-2xl font-extrabold tracking-[-0.03em] tabular-nums">
            {number.format(used)}
            <span className="text-sm font-semibold text-muted-foreground"> / {number.format(DAILY_QUOTA)} unidades</span>
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {number.format(data?.requests ?? 0)} {data?.requests === 1 ? "requisição" : "requisições"}
            {data?.updated_at ? ` · última às ${time.format(new Date(data.updated_at))}` : ""}
          </p>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Cota diária usada"
          aria-valuemin={0}
          aria-valuemax={DAILY_QUOTA}
          aria-valuenow={used}
        >
          <div className={cn("h-full rounded-full", high ? "bg-amber-500" : "bg-primary")} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          Reinicia à meia-noite do Pacífico (às {time.format(nextPacificMidnight(now))} no horário de Brasília).
          {high ? " Atenção: acima de 80% da cota." : ""}
        </p>
      </div>
    </section>
  )
}
