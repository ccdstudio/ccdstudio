import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { NewGenerationLink } from "@/components/ai/new-generation-link"
import { ScriptResultBody, scriptView } from "@/components/ai/results/script-result"
import { PageHeader } from "@/components/layout/page-header"
import { CopyButton } from "@/components/shared/copy-button"
import { DownloadButton } from "@/components/shared/download-button"
import { scriptInputSchema, scriptOutputSchema } from "@/lib/ai/prompts/script"
import { requireUser } from "@/lib/auth/dal"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Roteiro · CCD Studio" }

const HEADER = {
  eyebrow: "Roteiro",
  icon: "script" as const,
  help: "roteiro-resultado" as const,
}
const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
})
/** Nome de arquivo: sem acento, minúsculas, hífens. */
const slug = (t: string) =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) ||
  "roteiro"

async function Result({ params }: { params: PageProps<"/criar/roteiro/[id]">["params"] }) {
  const user = await requireUser()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const supabase = await createClient()
  const { data: generation } = await supabase
    .from("ai_generations")
    .select("id, created_at, input, output, credits_charged")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("feature", "script")
    .maybeSingle()
  if (!generation) notFound()

  const output = scriptOutputSchema.safeParse(generation.output)
  const input = scriptInputSchema.safeParse(generation.input)
  if (!output.success || !input.success) notFound()
  const o = output.data

  const { markdown } = scriptView(o, input.data)

  return (
    <>
      <PageHeader
        {...HEADER}
        title={o.titulo_sugerido}
        description={`${input.data.tema} · ${dateFmt.format(new Date(generation.created_at))}`}
        back={{ href: "/criar/roteiro" }}
        actions={
          <>
            <NewGenerationLink href="/criar/roteiro/novo" label="Novo roteiro" icon="script" />
            <CopyButton text={markdown} what="Roteiro" label="Copiar roteiro" size="default" />
            <DownloadButton text={markdown} filename={`roteiro-${slug(o.titulo_sugerido)}.md`} label="Baixar roteiro" what="Roteiro" />
          </>
        }
      />

      <ScriptResultBody output={o} input={input.data} credits={generation.credits_charged} />
    </>
  )
}

export default function ScriptResultPage({ params }: PageProps<"/criar/roteiro/[id]">) {
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
