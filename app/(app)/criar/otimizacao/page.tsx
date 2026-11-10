import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { isAiConfigured } from "@/lib/ai/client"
import { DEFAULT_NICHE } from "@/lib/ai/prompts/metadata"
import { requireUser } from "@/lib/auth/dal"
import { getCreditBalance } from "@/lib/credits/balance"
import { creditsLabel, FEATURE_COSTS } from "@/lib/credits/costs"
import { NOTICE } from "@/lib/status-colors"
import { createClient } from "@/lib/supabase/server"
import { NewOptimizationDialog } from "./new-optimization-dialog"

export const metadata: Metadata = { title: "Otimização de vídeo · CCD Studio" }

const HEADER = { eyebrow: "Criar", title: "Otimização de vídeo", icon: "optimize" as const }
const PAGE_SIZE = 10
const COST = FEATURE_COSTS.metadata
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })

type Row = { id: string; created_at: string; assunto: string | null; palavra: string | null; titulo: string | null }

async function Optimizations({ searchParams }: { searchParams: PageProps<"/criar/otimizacao">["searchParams"] }) {
  const user = await requireUser()
  const params = await searchParams
  const page = Math.max(1, Number(params.pagina) || 1)
  const from = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  const [{ data, count }, balance] = await Promise.all([
    supabase
      .from("ai_generations")
      // Só os campos da tabela (a saída completa fica na página do resultado).
      .select("id, created_at, assunto:input->>assunto, palavra:input->>palavraChave, titulo:output->titulos->0->>titulo", {
        count: "exact",
      })
      .eq("user_id", user.id)
      .eq("feature", "metadata")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
    getCreditBalance(user.id),
  ])

  const rows = (data ?? []) as unknown as Row[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const configured = isAiConfigured()
  const noCredits = balance.total < COST
  const notice = !configured
    ? "As ferramentas de IA ainda não foram configuradas."
    : noCredits
      ? `Você está sem créditos. Os créditos gratuitos renovam no dia 1.`
      : null

  const dialog = (label?: string) => (
    <NewOptimizationDialog
      cost={creditsLabel(COST)}
      defaultNiche={DEFAULT_NICHE}
      disabled={!configured || noCredits}
      label={label}
    />
  )

  return (
    <>
      <PageHeader
        {...HEADER}
        description="Títulos ranqueados, par título + thumbnail, descrição pensada para a busca, tags e perguntas de SEO."
        actions={dialog()}
      />

      {notice ? (
        <p role="status" className={NOTICE.warning}>
          {notice}
        </p>
      ) : null}

      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="label px-4">Data</TableHead>
              <TableHead className="label">Assunto</TableHead>
              <TableHead className="label">Palavra-chave</TableHead>
              <TableHead className="label">Título sugerido</TableHead>
              <TableHead className="label px-4 text-right">Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-4 text-muted-foreground tabular-nums">{dateFmt.format(new Date(row.created_at))}</TableCell>
                  <TableCell className="max-w-72 truncate">{row.assunto ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{row.palavra ?? "—"}</TableCell>
                  <TableCell className="max-w-80 truncate font-semibold">{row.titulo ?? "—"}</TableCell>
                  <TableCell className="px-4 text-right">
                    <Link href={`/criar/otimizacao/${row.id}`} className={buttonVariants({ variant: "outline", size: "xs" })}>
                      Abrir
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-12 text-center">
                  <p className="font-semibold">Nenhuma otimização ainda</p>
                  <p className="mt-1 mb-4 text-sm text-muted-foreground">
                    Informe o assunto, a palavra-chave e o objetivo do vídeo. Cada geração custa {creditsLabel(COST)}.
                  </p>
                  <div className="flex justify-center">{dialog("Criar a primeira")}</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground tabular-nums">
              Página {page} de {totalPages} · {total} otimizações
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link href={`/criar/otimizacao?pagina=${page - 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Anterior
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link href={`/criar/otimizacao?pagina=${page + 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
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

export default function OptimizationPage({ searchParams }: PageProps<"/criar/otimizacao">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} description="Carregando…" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Optimizations searchParams={searchParams} />
    </Suspense>
  )
}
