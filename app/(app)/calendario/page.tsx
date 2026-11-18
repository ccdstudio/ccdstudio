import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { NewGenerationLink } from "@/components/ai/new-generation-link"
import { PlanWeek } from "@/components/ai/plan-week"
import { PageHeader } from "@/components/layout/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { isAiConfigured } from "@/lib/ai/client"
import { formatDay, formatHours, planOutputSchema, planStoredInputSchema, weekDates } from "@/lib/ai/prompts/plan"
import { requireUser } from "@/lib/auth/dal"
import { getCreditBalance } from "@/lib/credits/balance"
import { creditsLabel, FEATURE_COSTS } from "@/lib/credits/costs"
import { NOTICE } from "@/lib/status-colors"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Calendário editorial · CCD Studio" }

const HEADER = { eyebrow: "Estratégia do canal", title: "Calendário editorial", icon: "calendar" as const, help: "calendario" as const }
const PAGE_SIZE = 10
const COST = FEATURE_COSTS.plan
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })

type Row = { id: string; created_at: string; inicio: string | null; principal: string | null; horas: number | null }

const weekRange = (start: string) => {
  const d = weekDates(start)
  return `${formatDay(d[0].date)} a ${formatDay(d[6].date)}`
}

async function Plans({ searchParams }: { searchParams: PageProps<"/calendario">["searchParams"] }) {
  const user = await requireUser()
  const params = await searchParams
  const page = Math.max(1, Number(params.pagina) || 1)
  const from = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  const [{ data, count }, { data: latest }, balance] = await Promise.all([
    supabase
      .from("ai_generations")
      .select("id, created_at, inicio:input->>inicio, principal:output->>titulo_principal, horas:output->horas_total", { count: "exact" })
      .eq("user_id", user.id)
      .eq("feature", "plan")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
    supabase
      .from("ai_generations")
      .select("id, input, output")
      .eq("user_id", user.id)
      .eq("feature", "plan")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getCreditBalance(user.id),
  ])

  const rows = (data ?? []) as unknown as Row[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const configured = isAiConfigured()
  const noCredits = balance.total < COST
  const newPlan = (label = "Novo plano") => (
    <NewGenerationLink href="/calendario/novo" label={label} icon="calendar" disabled={!configured || noCredits} />
  )

  // Plano mais recente em destaque (a semana em 7 dias).
  const latestOutput = latest ? planOutputSchema.safeParse(latest.output) : null
  const latestInput = latest ? planStoredInputSchema.safeParse(latest.input) : null

  return (
    <>
      <PageHeader
        {...HEADER}
        description={`A sua semana de publicação: 1 vídeo principal no melhor dia do canal, 1 vídeo simples e 3 Shorts, no tempo que você tem. Cada plano custa ${creditsLabel(COST)}.`}
        actions={newPlan()}
      />

      {!configured || noCredits ? (
        <p role="status" className={NOTICE.warning}>
          {!configured ? "As ferramentas de IA ainda não foram configuradas." : "Você está sem créditos. Os créditos gratuitos renovam no dia 1."}
        </p>
      ) : null}

      {latest && latestOutput?.success && latestInput?.success ? (
        <SectionCard
          title={`Plano mais recente · ${weekRange(latestInput.data.inicio)}`}
          description={`Vídeo principal: ${latestOutput.data.titulo_principal}`}
          actions={
            <Link href={`/calendario/${latest.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Abrir plano
            </Link>
          }
        >
          <PlanWeek output={latestOutput.data} start={latestInput.data.inicio} compact />
        </SectionCard>
      ) : null}

      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="label px-4">Semana</TableHead>
              <TableHead className="label">Vídeo principal</TableHead>
              <TableHead className="label">Horas</TableHead>
              <TableHead className="label">Gerado em</TableHead>
              <TableHead className="label px-4 text-right">Plano</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-4 whitespace-nowrap tabular-nums">{row.inicio ? weekRange(row.inicio) : "—"}</TableCell>
                  <TableCell className="max-w-96 truncate font-semibold">{row.principal ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{row.horas !== null ? formatHours(Number(row.horas)) : "—"}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{dateFmt.format(new Date(row.created_at))}</TableCell>
                  <TableCell className="px-4 text-right">
                    <Link href={`/calendario/${row.id}`} className={buttonVariants({ variant: "outline", size: "xs" })}>
                      Abrir
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-12 text-center">
                  <p className="font-semibold">Nenhum plano ainda</p>
                  <p className="mt-1 mb-4 text-sm text-muted-foreground">
                    Diga quanto tempo você tem e a IA monta a semana. Cada plano custa {creditsLabel(COST)}.
                  </p>
                  <div className="flex justify-center">{newPlan("Montar a primeira semana")}</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground tabular-nums">
              Página {page} de {totalPages} · {total} planos
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link href={`/calendario?pagina=${page - 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Anterior
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link href={`/calendario?pagina=${page + 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Próxima
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}

export default function CalendarPage({ searchParams }: PageProps<"/calendario">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} description="Carregando…" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Plans searchParams={searchParams} />
    </Suspense>
  )
}
