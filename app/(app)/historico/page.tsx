import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { InfoHint } from "@/components/shared/info-hint"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HISTORY_SELECT, HISTORY_TOOLS, isHistoryTool, toolInfo, type HistoryRow } from "@/lib/ai/history"
import { requireUser } from "@/lib/auth/dal"
import { creditsLabel } from "@/lib/credits/costs"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Histórico · CCD Studio" }

const HEADER = { eyebrow: "Conteúdo", title: "Histórico", icon: "history" as const, help: "historico" as const }
const DESCRIPTION = "Tudo o que você já gerou com IA, em um só lugar."
const PAGE_SIZE = 20
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })

function pageHref(tool: string | undefined, page: number) {
  const q = new URLSearchParams()
  if (tool) q.set("ferramenta", tool)
  if (page > 1) q.set("pagina", String(page))
  const s = q.toString()
  return s ? `/historico?${s}` : "/historico"
}

async function History({ searchParams }: { searchParams: PageProps<"/historico">["searchParams"] }) {
  const user = await requireUser()
  const params = await searchParams
  const raw = typeof params.ferramenta === "string" ? params.ferramenta : undefined
  const tool = isHistoryTool(raw) ? raw : undefined
  const page = Math.max(1, Number(params.pagina) || 1)
  const from = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  let query = supabase
    .from("ai_generations")
    .select(HISTORY_SELECT, { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  if (tool) query = query.eq("feature", tool)
  const { data, count } = await query

  const rows = (data ?? []) as unknown as HistoryRow[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filters: { key: string | undefined; label: string }[] = [
    { key: undefined, label: "Todas" },
    ...Object.entries(HISTORY_TOOLS).map(([key, t]) => ({ key, label: t.label })),
  ]

  return (
    <>
      <PageHeader {...HEADER} description={DESCRIPTION} />


      <nav aria-label="Filtrar por ferramenta" className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={pageHref(f.key, 1)}
            aria-current={f.key === tool ? "page" : undefined}
            className={buttonVariants({ variant: f.key === tool ? "default" : "outline", size: "sm" })}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="label px-4">Data</TableHead>
              <TableHead className="label">Ferramenta</TableHead>
              <TableHead className="label">Resumo</TableHead>
              <TableHead className="label">
                <span className="flex items-center gap-1">
                  Créditos
                  <InfoHint term="creditos" label="Créditos" />
                </span>
              </TableHead>
              <TableHead className="label px-4 text-right">Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => {
                const info = toolInfo(row.feature)
                return (
                  <TableRow key={row.id}>
                    <TableCell className="px-4 text-muted-foreground tabular-nums">{dateFmt.format(new Date(row.created_at))}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{info?.label ?? row.feature}</Badge>
                    </TableCell>
                    <TableCell className="max-w-96 truncate font-semibold">{info?.summary(row) ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{creditsLabel(row.credits_charged)}</TableCell>
                    <TableCell className="px-4 text-right">
                      {info ? (
                        <Link href={info.href(row.id)} className={buttonVariants({ variant: "outline", size: "xs" })}>
                          Abrir
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-12 text-center">
                  <p className="font-semibold">{tool ? "Nada gerado com esta ferramenta ainda" : "Você ainda não gerou nada"}</p>
                  <p className="mt-1 mb-4 text-sm text-muted-foreground">
                    Comece pela otimização de um vídeo ou por um roteiro. O resultado aparece aqui automaticamente.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Link href="/criar/otimizacao" className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Otimização de vídeo
                    </Link>
                    <Link href="/criar/roteiro" className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Roteiro
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground tabular-nums">
              Página {page} de {totalPages} · {total} gerações
            </span>
            <div className={cn("flex gap-2")}>
              {page > 1 ? (
                <Link href={pageHref(tool, page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Anterior
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link href={pageHref(tool, page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
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

export default function HistoryPage({ searchParams }: PageProps<"/historico">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} description="Carregando…" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <History searchParams={searchParams} />
    </Suspense>
  )
}
