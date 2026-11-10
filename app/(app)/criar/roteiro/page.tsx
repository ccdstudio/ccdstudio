import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { NewGenerationLink } from "@/components/ai/new-generation-link"
import { PageHeader } from "@/components/layout/page-header"
import { buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { isAiConfigured } from "@/lib/ai/client"
import { requireUser } from "@/lib/auth/dal"
import { getCreditBalance } from "@/lib/credits/balance"
import { creditsLabel, FEATURE_COSTS } from "@/lib/credits/costs"
import { NOTICE } from "@/lib/status-colors"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Roteiro · CCD Studio" }

const HEADER = { eyebrow: "Criar", title: "Roteiro", icon: "script" as const, help: "roteiro" as const }
const PAGE_SIZE = 10
const COST = FEATURE_COSTS.script
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })

type Row = { id: string; created_at: string; tema: string | null; duracao: string | null; titulo: string | null }

async function Scripts({ searchParams }: { searchParams: PageProps<"/criar/roteiro">["searchParams"] }) {
  const user = await requireUser()
  const params = await searchParams
  // Links antigos com ?tema= (pré-preenchimento) agora vão para o formulário em etapas.
  if (typeof params.tema === "string") {
    const q = new URLSearchParams()
    for (const k of ["tema", "publico", "objetivo"]) if (typeof params[k] === "string") q.set(k, params[k] as string)
    redirect(`/criar/roteiro/novo?${q}`)
  }
  const page = Math.max(1, Number(params.pagina) || 1)
  const from = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  const [{ data, count }, balance] = await Promise.all([
    supabase
      .from("ai_generations")
      .select("id, created_at, tema:input->>tema, duracao:input->>duracao, titulo:output->>titulo_sugerido", { count: "exact" })
      .eq("user_id", user.id)
      .eq("feature", "script")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
    getCreditBalance(user.id),
  ])

  const rows = (data ?? []) as unknown as Row[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const configured = isAiConfigured()
  const noCredits = balance.total < COST
  const dialog = (label = "Novo roteiro") => (
    <NewGenerationLink href="/criar/roteiro/novo" label={label} icon="script" disabled={!configured || noCredits} />
  )

  return (
    <>
      <PageHeader
        {...HEADER}
        description="Roteiros com 5 ganchos pontuados nas 21 fórmulas, blocos com o que vai na tela e tempo estimado."
        actions={dialog()}
      />


      {!configured || noCredits ? (
        <p role="status" className={NOTICE.warning}>
          {!configured ? "As ferramentas de IA ainda não foram configuradas." : "Você está sem créditos. Os créditos gratuitos renovam no dia 1."}
        </p>
      ) : null}

      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="label px-4">Data</TableHead>
              <TableHead className="label">Tema</TableHead>
              <TableHead className="label">Duração</TableHead>
              <TableHead className="label">Título sugerido</TableHead>
              <TableHead className="label px-4 text-right">Roteiro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-4 text-muted-foreground tabular-nums">{dateFmt.format(new Date(row.created_at))}</TableCell>
                  <TableCell className="max-w-72 truncate">{row.tema ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{row.duracao ? `${row.duracao} min` : "—"}</TableCell>
                  <TableCell className="max-w-80 truncate font-semibold">{row.titulo ?? "—"}</TableCell>
                  <TableCell className="px-4 text-right">
                    <Link href={`/criar/roteiro/${row.id}`} className={buttonVariants({ variant: "outline", size: "xs" })}>
                      Abrir
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-12 text-center">
                  <p className="font-semibold">Nenhum roteiro ainda</p>
                  <p className="mt-1 mb-4 text-sm text-muted-foreground">
                    Informe o tema, o público e o objetivo. Cada roteiro custa {creditsLabel(COST)}.
                  </p>
                  <div className="flex justify-center">{dialog("Escrever o primeiro")}</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground tabular-nums">
              Página {page} de {totalPages} · {total} roteiros
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link href={`/criar/roteiro?pagina=${page - 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Anterior
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link href={`/criar/roteiro?pagina=${page + 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
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

export default function ScriptPage({ searchParams }: PageProps<"/criar/roteiro">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} description="Carregando…" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Scripts searchParams={searchParams} />
    </Suspense>
  )
}
