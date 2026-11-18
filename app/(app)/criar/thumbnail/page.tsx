import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { NewGenerationLink } from "@/components/ai/new-generation-link"
import { PageHeader } from "@/components/layout/page-header"
import { buttonVariants } from "@/components/ui/button"
import { isAiConfigured } from "@/lib/ai/client"
import { signedThumbnailUrls } from "@/lib/ai/run-thumbnail"
import { requireUser } from "@/lib/auth/dal"
import { getCreditBalance } from "@/lib/credits/balance"
import { creditsLabel, FEATURE_COSTS } from "@/lib/credits/costs"
import { NOTICE } from "@/lib/status-colors"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Thumbnail · CCD Studio" }

const HEADER = { eyebrow: "Criar", title: "Thumbnail", icon: "thumbnail" as const, help: "thumbnail" as const }
const PAGE_SIZE = 12
const COST = FEATURE_COSTS.thumbnail
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })

type Row = { id: string; created_at: string; titulo: string | null; texto: string | null; imagem: string | null }

async function Thumbnails({ searchParams }: { searchParams: PageProps<"/criar/thumbnail">["searchParams"] }) {
  const user = await requireUser()
  const params = await searchParams
  const page = Math.max(1, Number(params.pagina) || 1)
  const from = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  const [{ data, count }, balance] = await Promise.all([
    supabase
      .from("ai_generations")
      .select("id, created_at, titulo:input->>titulo, texto:output->>texto_capa, imagem:output->>imagem_path", { count: "exact" })
      .eq("user_id", user.id)
      .eq("feature", "thumbnail")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
    getCreditBalance(user.id),
  ])

  const rows = (data ?? []) as unknown as Row[]
  // As linhas já são do próprio usuário (RLS + filtro): só então as URLs assinadas.
  const urls = await signedThumbnailUrls(rows.flatMap((r) => (r.imagem ? [r.imagem] : [])))
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const configured = isAiConfigured()
  const noCredits = balance.total < COST
  const newThumb = (label = "Nova thumbnail") => (
    <NewGenerationLink href="/criar/thumbnail/nova" label={label} icon="image" disabled={!configured || noCredits} />
  )

  return (
    <>
      <PageHeader
        {...HEADER}
        description={`A IA cria a ideia da capa, escreve o prompt e desenha a imagem em 1280×720, com a sua foto se quiser. Cada capa custa ${creditsLabel(COST)}.`}
        actions={newThumb()}
      />

      {!configured || noCredits ? (
        <p role="status" className={NOTICE.warning}>
          {!configured
            ? "As ferramentas de IA ainda não foram configuradas."
            : `Você precisa de ${creditsLabel(COST)} para gerar uma capa. Os créditos gratuitos renovam no dia 1.`}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const src = row.imagem ? urls.get(row.imagem) : undefined
            return (
              <li key={row.id}>
                <Link
                  href={`/criar/thumbnail/${row.id}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" loading="lazy" className="aspect-video w-full object-cover transition-opacity group-hover:opacity-90" />
                  ) : (
                    <div className="aspect-video w-full bg-muted" />
                  )}
                  <div className="flex flex-col gap-0.5 p-3">
                    <span className="truncate text-sm font-semibold">{row.titulo ?? "Thumbnail"}</span>
                    <span className="truncate text-xs text-muted-foreground tabular-nums">
                      {row.texto ? `“${row.texto}” · ` : ""}
                      {dateFmt.format(new Date(row.created_at))}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <section className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="font-semibold">Nenhuma capa ainda</p>
          <p className="mb-2 max-w-md text-sm text-muted-foreground">
            Informe o título e o assunto do vídeo. Cada capa custa {creditsLabel(COST)}.
          </p>
          {newThumb("Criar a primeira capa")}
        </section>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground tabular-nums">
            Página {page} de {totalPages} · {total} capas
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={`/criar/thumbnail?pagina=${page - 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Anterior
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link href={`/criar/thumbnail?pagina=${page + 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Próxima
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}

export default function ThumbnailPage({ searchParams }: PageProps<"/criar/thumbnail">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} description="Carregando…" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Thumbnails searchParams={searchParams} />
    </Suspense>
  )
}
