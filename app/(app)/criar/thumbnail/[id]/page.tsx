import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download04Icon } from "@hugeicons/core-free-icons"
import { NewGenerationLink } from "@/components/ai/new-generation-link"
import { ThumbnailResultBody } from "@/components/ai/results/thumbnail-result"
import { PageHeader } from "@/components/layout/page-header"
import { buttonVariants } from "@/components/ui/button"
import { thumbnailOutputSchema, thumbnailStoredInputSchema } from "@/lib/ai/prompts/thumbnail"
import { signedThumbnailDownload, signedThumbnailUrls } from "@/lib/ai/run-thumbnail"
import { requireUser } from "@/lib/auth/dal"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Thumbnail · CCD Studio" }

const HEADER = { eyebrow: "Thumbnail", icon: "thumbnail" as const, help: "thumbnail-resultado" as const }
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" })

/** Nome de arquivo: sem acento, minúsculas, hífens. */
const slug = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) ||
  "thumbnail"

async function Result({ params }: { params: PageProps<"/criar/thumbnail/[id]">["params"] }) {
  const user = await requireUser()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const supabase = await createClient()
  const { data: generation } = await supabase
    .from("ai_generations")
    .select("id, created_at, input, output, credits_charged")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("feature", "thumbnail")
    .maybeSingle()
  if (!generation) notFound()

  const output = thumbnailOutputSchema.safeParse(generation.output)
  const input = thumbnailStoredInputSchema.safeParse(generation.input)
  if (!output.success || !input.success) notFound()
  const o = output.data
  const i = input.data

  const filename = `thumbnail-${slug(i.titulo)}.jpg`
  const [urls, download] = await Promise.all([signedThumbnailUrls([o.imagem_path]), signedThumbnailDownload(o.imagem_path, filename)])
  const image = urls.get(o.imagem_path)

  return (
    <>
      <PageHeader
        {...HEADER}
        title={i.titulo}
        description={`Capa gerada em ${dateFmt.format(new Date(generation.created_at))}`}
        back={{ href: "/criar/thumbnail" }}
        actions={
          <>
            <NewGenerationLink href="/criar/thumbnail/nova" label="Nova thumbnail" icon="image" />
            {download ? (
              <a href={download} className={buttonVariants({ variant: "outline" })}>
                <HugeiconsIcon icon={Download04Icon} strokeWidth={1.75} data-icon="inline-start" />
                Baixar imagem
              </a>
            ) : null}
          </>
        }
      />

      <ThumbnailResultBody output={o} input={i} image={image} credits={generation.credits_charged} />
    </>
  )
}

export default function ThumbnailResultPage({ params }: PageProps<"/criar/thumbnail/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} title="Thumbnail" description="Carregando…" />
          <div className="aspect-video animate-pulse rounded-2xl border border-border bg-card" />
        </>
      }
    >
      <Result params={params} />
    </Suspense>
  )
}
