import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { NewGenerationLink } from "@/components/ai/new-generation-link"
import { PageHeader } from "@/components/layout/page-header"
import { CopyButton } from "@/components/shared/copy-button"
import { SectionCard } from "@/components/shared/section-card"
import { Stagger } from "@/components/shared/stagger"
import { Badge } from "@/components/ui/badge"
import { metadataOutputSchema, metadataInputSchema } from "@/lib/ai/schemas/metadata"
import { requireUser } from "@/lib/auth/dal"
import { creditsLabel } from "@/lib/credits/costs"
import { CHECK_ICON, scoreTone } from "@/lib/status-colors"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { queryTest, rankTitles } from "@/lib/youtube/title-lint"

export const metadata: Metadata = { title: "Resultado da otimização · CCD Studio" }

const HEADER = { eyebrow: "Otimização de vídeo", icon: "optimize" as const, help: "otimizacao-resultado" as const }
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" })

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="outline" className="font-medium">
          {item}
        </Badge>
      ))}
    </div>
  )
}

function Block({ label, text, copy, what }: { label: string; text: string; copy?: string; what: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="label">{label}</span>
        <CopyButton text={copy ?? text} what={what} />
      </div>
      <p className="rounded-lg border border-border bg-muted/50 p-3 text-sm leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  )
}

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

  const ranked = rankTitles(o.titulos, o.thumbnail.texto)
  const best = ranked[0]
  const queries = queryTest(o.buscas_alvo, best.titulo, o.descricao.primeiras_linhas)
  const description = `${o.descricao.primeiras_linhas}\n\n${o.descricao.corpo}`

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

      <Stagger className="flex flex-col gap-6">
        <SectionCard
          title="Títulos"
          term="notaTitulo"
          description="Ranqueados pelo lint do título: tamanho (60/40), CAIXA ALTA, palavras vagas, número concreto e repetição com a thumbnail."
        >
          <ol className="flex flex-col gap-3">
            {ranked.map((t, i) => (
              <li
                key={t.titulo}
                className={cn("flex flex-col gap-2 rounded-lg border border-border p-3", i === 0 && "border-primary/40 bg-primary/5")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-semibold">{t.titulo}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.angulo} · {t.lint.chars} caracteres
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className={cn("tabular-nums", scoreTone(t.lint.score))}>
                      {t.lint.score}
                    </Badge>
                    <CopyButton text={t.titulo} what="Título" />
                  </div>
                </div>
                {t.lint.issues.length > 0 && i < 3 ? (
                  <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {t.lint.issues.map((issue) => (
                      <li key={issue.kind}>
                        <strong className="font-semibold text-foreground">{issue.kind}:</strong> {issue.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard
          title="Thumbnail"
          hint="A imagem que aparece antes do clique. Aqui vem o texto curto para colocar nela, uma orientação para quem for montar a imagem e dois textos prontos para colar num gerador de imagens."
          description="Título e thumbnail são uma peça só: o texto da imagem diz o que o título não diz, em até 3 palavras."
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-4">
              <span className="font-heading text-2xl font-extrabold tracking-[-0.03em] uppercase">{o.thumbnail.texto}</span>
              <CopyButton text={o.thumbnail.texto} what="Texto da thumbnail" />
            </div>
            <Block label="Briefing para o designer" text={o.thumbnail.briefing} what="Briefing" />
            <Block label="Prompt de imagem (com personagem)" text={o.thumbnail.prompt_com_imagem} what="Prompt" />
            <Block label="Prompt de imagem (só texto)" text={o.thumbnail.prompt_apenas_texto} what="Prompt" />
          </div>
        </SectionCard>

        <SectionCard
          title="Descrição"
          description="As 2 primeiras linhas são o snippet da busca e o que aparece antes de “mais”."
          actions={<CopyButton text={description} what="Descrição" label="Copiar tudo" />}
        >
          <div className="flex flex-col gap-4">
            <Block label="Primeiras linhas" text={o.descricao.primeiras_linhas} what="Primeiras linhas" />
            <Block label="Corpo" text={o.descricao.corpo} what="Corpo da descrição" />
            <Block label="CTA final" text={o.cta_final} what="CTA" />
          </div>
        </SectionCard>

        <SectionCard
          title="Teste das 3 buscas"
          term="buscas"
          description="As buscas que este vídeo deve vencer. O título escolhido e as primeiras linhas precisam conter as palavras delas."
        >
          <ul className="flex flex-col gap-2">
            {queries.map((q) => (
              <li key={q.query} className="flex items-start gap-2 text-sm">
                <HugeiconsIcon
                  icon={q.ok ? CheckmarkCircle02Icon : AlertCircleIcon}
                  strokeWidth={1.75}
                  className={cn("mt-0.5 size-4 shrink-0", q.ok ? CHECK_ICON.ok : CHECK_ICON.warn)}
                />
                <span>
                  <strong className="font-semibold">{q.query}</strong>
                  {q.ok ? null : (
                    <span className="text-muted-foreground"> · faltam no título/primeiras linhas: {q.missing.join(", ")}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Tags e hashtags"
          term="tags"
          description="Tags servem para desambiguação (grafias, siglas, termos citados). 10 a 15 bastam."
          actions={
            <>
              <CopyButton text={o.tags.join(", ")} what="Tags" label="Copiar tags" />
              <CopyButton text={o.hashtags.join(" ")} what="Hashtags" label="Copiar hashtags" />
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="label">Tags</span>
              <Chips items={o.tags} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="label">Hashtags</span>
              <Chips items={o.hashtags} />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Perguntas de busca"
          description={`${o.perguntas_seo.length} perguntas como as pessoas pesquisam: ideias para o roteiro, capítulos e comentários fixados.`}
          actions={<CopyButton text={o.perguntas_seo.join("\n")} what="Perguntas" label="Copiar todas" />}
        >
          {/* Em colunas: a numeração desce a 1ª coluna inteira e continua no topo da 2ª. */}
          <ol className="list-decimal gap-x-10 pl-5 text-sm sm:columns-2">
            {o.perguntas_seo.map((q) => (
              <li key={q} className="mb-1.5 break-inside-avoid">
                {q}
              </li>
            ))}
          </ol>
        </SectionCard>

        <p className="text-center text-xs text-muted-foreground">
          Gerado por IA com {creditsLabel(generation.credits_charged)}. Revise antes de publicar: nada é publicado automaticamente.
        </p>
      </Stagger>
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
