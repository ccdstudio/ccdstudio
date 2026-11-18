import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { NewGenerationLink } from "@/components/ai/new-generation-link"
import { metadataToMarkdown, MetadataResultBody } from "@/components/ai/results/metadata-result"
import { ScriptResultBody, scriptView } from "@/components/ai/results/script-result"
import { ThumbnailResultBody } from "@/components/ai/results/thumbnail-result"
import { PageHeader } from "@/components/layout/page-header"
import { CopyButton } from "@/components/shared/copy-button"
import { DataList } from "@/components/shared/data-list"
import { DownloadButton } from "@/components/shared/download-button"
import { SectionCard } from "@/components/shared/section-card"
import { Stagger } from "@/components/shared/stagger"
import { buttonVariants } from "@/components/ui/button"
import { scriptInputSchema, scriptOutputSchema } from "@/lib/ai/prompts/script"
import { thumbnailOutputSchema, thumbnailStoredInputSchema } from "@/lib/ai/prompts/thumbnail"
import { videoOutputSchema, videoStoredInputSchema } from "@/lib/ai/prompts/video"
import { signedThumbnailDownload, signedThumbnailUrls } from "@/lib/ai/run-thumbnail"
import { metadataOutputSchema } from "@/lib/ai/schemas/metadata"
import { requireUser } from "@/lib/auth/dal"
import { creditsLabel, FEATURE_COSTS } from "@/lib/credits/costs"
import { createClient } from "@/lib/supabase/server"
import { RetryPart } from "./retry-part"
import { VideoTabs } from "./video-tabs"

export const metadata: Metadata = { title: "Vídeo completo · CCD Studio" }
// "Gerar de novo só esta parte" roda nesta página e pode passar de 1 minuto.
export const maxDuration = 300

const HEADER = { eyebrow: "Vídeo completo", icon: "video" as const, help: "video-resultado" as const }
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" })

const slug = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "video"

type Row = { id: string; feature: string; input: unknown; output: unknown; credits_charged: number }

async function Result({ params }: { params: PageProps<"/criar/video/[id]">["params"] }) {
  const user = await requireUser()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const supabase = await createClient()
  const { data: pkg } = await supabase
    .from("ai_generations")
    .select("id, created_at, input, output")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("feature", "video")
    .maybeSingle()
  if (!pkg) notFound()
  const parsedOut = videoOutputSchema.safeParse(pkg.output)
  const parsedIn = videoStoredInputSchema.safeParse(pkg.input)
  if (!parsedOut.success || !parsedIn.success) notFound()
  const pack = parsedOut.data
  const stored = parsedIn.data

  // As 3 partes numa consulta só (só as do próprio usuário).
  const ids = Object.values(pack.partes).flatMap((p) => ("id" in p ? [p.id] : []))
  const { data: rows } = ids.length
    ? await supabase.from("ai_generations").select("id, feature, input, output, credits_charged").eq("user_id", user.id).in("id", ids)
    : { data: [] as Row[] }
  const byId = new Map(((rows ?? []) as Row[]).map((r) => [r.id, r]))
  const row = (key: keyof typeof pack.partes) => {
    const p = pack.partes[key]
    return "id" in p ? byId.get(p.id) : undefined
  }

  // Otimização
  const mRow = row("metadata")
  const meta = mRow ? metadataOutputSchema.safeParse(mRow.output) : null
  // Roteiro
  const sRow = row("script")
  const sOut = sRow ? scriptOutputSchema.safeParse(sRow.output) : null
  const sIn = sRow ? scriptInputSchema.safeParse(sRow.input) : null
  const script = sOut?.success && sIn?.success ? { o: sOut.data, i: sIn.data, view: scriptView(sOut.data, sIn.data) } : null
  // Thumbnail
  const tRow = row("thumbnail")
  const tOut = tRow ? thumbnailOutputSchema.safeParse(tRow.output) : null
  const tIn = tRow ? thumbnailStoredInputSchema.safeParse(tRow.input) : null
  const thumb = tOut?.success && tIn?.success ? { o: tOut.data, i: tIn.data } : null
  const [urls, download] = thumb
    ? await Promise.all([
        signedThumbnailUrls([thumb.o.imagem_path]),
        signedThumbnailDownload(thumb.o.imagem_path, `thumbnail-${slug(pack.titulo)}.jpg`),
      ])
    : [new Map<string, string>(), null]
  const image = thumb ? urls.get(thumb.o.imagem_path) : undefined

  const errorOf = (key: keyof typeof pack.partes) => {
    const p = pack.partes[key]
    return "erro" in p ? p.erro : "Não foi possível carregar esta parte."
  }

  const markdown = [
    `# ${pack.titulo}`,
    `**Sobre o vídeo:** ${pack.briefing.tema}  \n**Para quem:** ${pack.briefing.publico}  \n**Palavra-chave:** ${pack.briefing.palavra_chave}`,
    meta?.success ? metadataToMarkdown(meta.data) : "",
    thumb ? `## Thumbnail\n\n**Texto da capa:** ${thumb.o.texto_capa}\n\n**Prompt da imagem:** ${thumb.o.prompt_imagem}` : "",
    script ? `---\n\n${script.view.markdown}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")

  const total = (["metadata", "script", "thumbnail"] as const).reduce((sum, k) => sum + (row(k)?.credits_charged ?? 0), 0)

  const resumo = (
    <Stagger className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={`Capa do vídeo: ${pack.titulo}`} width={1280} height={720} className="aspect-video w-full object-cover" />
          ) : (
            <div className="flex aspect-video items-center justify-center p-6 text-center text-sm text-muted-foreground">
              {thumb ? "Não foi possível carregar a imagem agora. Recarregue a página." : "A capa não foi gerada. Veja a aba Thumbnail."}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-1">
            <span className="label">Título</span>
            <div className="flex items-start justify-between gap-2">
              <p className="font-heading text-xl font-bold tracking-[-0.02em]">{pack.titulo}</p>
              <CopyButton text={pack.titulo} what="Título" />
            </div>
          </div>
          {meta?.success ? (
            <div className="flex flex-col gap-1">
              <span className="label">Começo da descrição</span>
              <p className="text-sm leading-relaxed text-muted-foreground">{meta.data.descricao.primeiras_linhas}</p>
            </div>
          ) : null}
          {script ? (
            <div className="flex flex-col gap-1">
              <span className="label">Primeira frase do vídeo</span>
              <p className="text-sm leading-relaxed">“{script.view.best}”</p>
            </div>
          ) : null}
          <div className="mt-auto flex flex-wrap gap-2">
            <DownloadButton text={markdown} filename={`video-${slug(pack.titulo)}.md`} label="Baixar tudo (.md)" what="Vídeo completo" />
            {download ? (
              <a href={download} className={buttonVariants({ variant: "outline" })}>
                Baixar capa
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <SectionCard title="O que a IA entendeu do seu pedido" description="O briefing que alimentou as três partes.">
        <DataList
          items={[
            { label: "Sobre o vídeo", value: pack.briefing.tema, wide: true },
            { label: "Para quem", value: pack.briefing.publico },
            { label: "Palavra-chave", value: pack.briefing.palavra_chave },
            { label: "Objetivo", value: pack.briefing.objetivo, wide: true },
            { label: "Duração", value: `${stored.duracao} minutos` },
            { label: "Sua foto na capa", value: stored.usou_foto ? "sim" : "não" },
            { label: "Seu pedido", value: stored.pedido, wide: true },
          ]}
        />
      </SectionCard>

      <SectionCard title="As partes" description="Cada parte também fica no Histórico e pode ser aberta sozinha.">
        <ul className="flex flex-col divide-y divide-border">
          {(
            [
              { key: "metadata", label: "Título e SEO", href: "/criar/otimizacao", ok: Boolean(meta?.success) },
              { key: "script", label: "Roteiro", href: "/criar/roteiro", ok: Boolean(script) },
              { key: "thumbnail", label: "Thumbnail", href: "/criar/thumbnail", ok: Boolean(thumb) },
            ] as const
          ).map((p) => {
            const r = row(p.key)
            return (
              <li key={p.key} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="font-medium">{p.label}</span>
                {p.ok && r ? (
                  <Link href={`${p.href}/${r.id}`} className="text-primary underline-offset-4 hover:underline">
                    Abrir sozinha
                  </Link>
                ) : (
                  <Link href={`?aba=${p.key === "metadata" ? "otimizacao" : p.key === "script" ? "roteiro" : "thumbnail"}`} className="text-muted-foreground">
                    Falhou · tentar de novo
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </SectionCard>

      <p className="text-center text-xs text-muted-foreground">
        Gerado por IA com {creditsLabel(total)}. Revise tudo antes de publicar: nada é publicado automaticamente.
      </p>
    </Stagger>
  )

  return (
    <>
      <PageHeader
        {...HEADER}
        title={pack.titulo}
        description={`${pack.briefing.palavra_chave} · ${dateFmt.format(new Date(pkg.created_at))}`}
        back={{ href: "/criar/video" }}
        actions={<NewGenerationLink href="/criar/video/novo" label="Novo vídeo completo" icon="video" />}
      />

      <VideoTabs
        panels={{
          resumo,
          otimizacao:
            meta?.success && mRow ? (
              <MetadataResultBody output={meta.data} credits={mRow.credits_charged} />
            ) : (
              <RetryPart packageId={id} part="metadata" what="o título e o SEO" error={errorOf("metadata")} cost={creditsLabel(FEATURE_COSTS.metadata)} />
            ),
          roteiro:
            script && sRow ? (
              <ScriptResultBody output={script.o} input={script.i} credits={sRow.credits_charged} />
            ) : (
              <RetryPart packageId={id} part="script" what="o roteiro" error={errorOf("script")} cost={creditsLabel(FEATURE_COSTS.script)} />
            ),
          thumbnail:
            thumb && tRow ? (
              <ThumbnailResultBody output={thumb.o} input={thumb.i} image={image} credits={tRow.credits_charged} />
            ) : (
              <RetryPart
                packageId={id}
                part="thumbnail"
                what="a capa"
                error={errorOf("thumbnail")}
                cost={creditsLabel(FEATURE_COSTS.thumbnail)}
                note="A nova capa sai sem a sua foto, porque a foto não fica guardada. Para usar a foto, crie a capa em Criar → Thumbnail."
              />
            ),
        }}
      />
    </>
  )
}

export default function VideoResultPage({ params }: PageProps<"/criar/video/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} title="Vídeo completo" description="Carregando…" />
          <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Result params={params} />
    </Suspense>
  )
}
