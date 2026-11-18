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
import { creditsLabel, VIDEO_PACKAGE_COST } from "@/lib/credits/costs"
import { NOTICE } from "@/lib/status-colors"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Vídeo completo · CCD Studio" }

const HEADER = { eyebrow: "Criar", title: "Vídeo completo", icon: "video" as const, help: "video" as const }
const PAGE_SIZE = 12
const COST = VIDEO_PACKAGE_COST
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })

type Row = { id: string; created_at: string; titulo: string | null; capa: string | null; capa_path: string | null }

async function Packages({ searchParams }: { searchParams: PageProps<"/criar/video">["searchParams"] }) {
  const user = await requireUser()
  const params = await searchParams
  const page = Math.max(1, Number(params.pagina) || 1)
  const from = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  const [{ data, count }, balance] = await Promise.all([
    supabase
      .from("ai_generations")
      .select("id, created_at, titulo:output->>titulo, capa:output->partes->thumbnail->>id, capa_path:output->>capa_path", { count: "exact" })
      .eq("user_id", user.id)
      .eq("feature", "video")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
    getCreditBalance(user.id),
  ])
  const rows = (data ?? []) as unknown as Row[]

  // Miniatura: pacotes novos já guardam o caminho da imagem; os antigos leem da geração da capa.
  const capaIds = rows.flatMap((r) => (r.capa && !r.capa_path ? [r.capa] : []))
  const { data: capas } = capaIds.length
    ? await supabase.from("ai_generations").select("id, path:output->>imagem_path").eq("user_id", user.id).in("id", capaIds)
    : { data: [] }
  const pathById = new Map(((capas ?? []) as unknown as { id: string; path: string | null }[]).flatMap((c) => (c.path ? [[c.id, c.path] as const] : [])))
  const paths = [...rows.flatMap((r) => (r.capa_path ? [r.capa_path] : [])), ...pathById.values()]
  const urls = await signedThumbnailUrls(paths)
  const imageOf = (r: Row) => {
    const path = r.capa_path ?? (r.capa ? pathById.get(r.capa) : undefined)
    return path ? urls.get(path) : undefined
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const configured = isAiConfigured()
  const noCredits = balance.total < COST
  const newVideo = (label = "Novo vídeo completo") => (
    <NewGenerationLink href="/criar/video/novo" label={label} icon="video" disabled={!configured || noCredits} />
  )

  return (
    <>
      <PageHeader
        {...HEADER}
        description={`Um pedido só e a IA entrega tudo do vídeo: título, descrição e SEO, o roteiro inteiro e a thumbnail. Custa ${creditsLabel(COST)} (a soma das três ferramentas).`}
        actions={newVideo()}
      />

      {!configured || noCredits ? (
        <p role="status" className={NOTICE.warning}>
          {!configured
            ? "As ferramentas de IA ainda não foram configuradas."
            : `Você precisa de ${creditsLabel(COST)} para o vídeo completo. Os créditos gratuitos renovam no dia 1.`}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const src = imageOf(row)
            return (
              <li key={row.id}>
                <Link
                  href={`/criar/video/${row.id}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" loading="lazy" className="aspect-video w-full object-cover transition-opacity group-hover:opacity-90" />
                  ) : (
                    <div className="aspect-video w-full bg-muted" />
                  )}
                  <div className="flex flex-col gap-0.5 p-3">
                    <span className="line-clamp-2 text-sm font-semibold">{row.titulo ?? "Vídeo completo"}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{dateFmt.format(new Date(row.created_at))}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <section className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="font-semibold">Nenhum vídeo completo ainda</p>
          <p className="mb-2 max-w-md text-sm text-muted-foreground">
            Conte em poucas linhas sobre o vídeo que quer gravar. Em pouco mais de 1 minuto sai o título, a descrição, o roteiro e a capa.
          </p>
          {newVideo("Criar o primeiro")}
        </section>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground tabular-nums">
            Página {page} de {totalPages} · {total} vídeos
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={`/criar/video?pagina=${page - 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Anterior
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link href={`/criar/video?pagina=${page + 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Próxima
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}

export default function VideoPage({ searchParams }: PageProps<"/criar/video">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} description="Carregando…" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Packages searchParams={searchParams} />
    </Suspense>
  )
}
