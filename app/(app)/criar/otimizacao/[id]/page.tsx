import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { NewGenerationLink } from "@/components/ai/new-generation-link"
import { MetadataResultBody } from "@/components/ai/results/metadata-result"
import { PageHeader } from "@/components/layout/page-header"
import { metadataOutputSchema, metadataInputSchema } from "@/lib/ai/schemas/metadata"
import { requireUser } from "@/lib/auth/dal"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Resultado da otimização · CCD Studio" }

const HEADER = { eyebrow: "Otimização de vídeo", icon: "optimize" as const, help: "otimizacao-resultado" as const }
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" })

async function Result({ params }: { params: PageProps<"/criar/otimizacao/[id]">["params"] }) {
  const user = await requireUser()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const supabase = await createClient()
  const { data: generation } = await supabase
    .from("ai_generations")
    .select("id, created_at, input, output, credits_charged")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("feature", "metadata")
    .maybeSingle()
  if (!generation) notFound()

  const output = metadataOutputSchema.safeParse(generation.output)
  const input = metadataInputSchema.safeParse(generation.input)
  if (!output.success || !input.success) notFound()
  const o = output.data

  return (
    <>
      <PageHeader
        {...HEADER}
        title={input.data.palavraChave}
        description={`${input.data.assunto} · ${dateFmt.format(new Date(generation.created_at))}`}
        back={{ href: "/criar/otimizacao" }}
        actions={
          <>
            <NewGenerationLink href="/criar/otimizacao/nova" label="Nova otimização" />
          </>
        }
      />

      <MetadataResultBody output={o} credits={generation.credits_charged} />
    </>
  )
}

export default function OptimizationResultPage({ params }: PageProps<"/criar/otimizacao/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} title="Carregando…" />
          <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Result params={params} />
    </Suspense>
  )
}
