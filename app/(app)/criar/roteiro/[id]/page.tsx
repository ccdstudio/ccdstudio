import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { NewGenerationLink } from "@/components/ai/new-generation-link"
import { PageHeader } from "@/components/layout/page-header"
import { CopyButton } from "@/components/shared/copy-button"
import { DownloadButton } from "@/components/shared/download-button"
import { SectionCard } from "@/components/shared/section-card"
import { Stagger } from "@/components/shared/stagger"
import { Badge } from "@/components/ui/badge"
import { cleanHook, scriptInputSchema, scriptOutputSchema, scriptToMarkdown, spokenWords } from "@/lib/ai/prompts/script"
import { requireUser } from "@/lib/auth/dal"
import { creditsLabel } from "@/lib/credits/costs"
import { HOOK_BAND_TONE } from "@/lib/status-colors"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { rankHooks } from "@/lib/youtube/hook-score"

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
const BAND_LABEL = {
  forte: "Forte",
  ok: "Dá para usar",
  fraco: "Fraco",
} as const

/** Nome de arquivo: sem acento, minúsculas, hífens. */
const slug = (t: string) =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) ||
  "roteiro"

function runtime(words: number) {
  const seconds = Math.round((words / 150) * 60)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

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

  // Nota dos ganchos (porta do hookscore.py): os 2 melhores em destaque.
  const hooks = o.ganchos.map((g) => ({
    texto: cleanHook(g.texto, g.formula),
    formula: g.formula,
  }))
  const ranked = rankHooks(hooks.map((g) => g.texto))
  const best = ranked[0]?.hook ?? hooks[0]?.texto ?? ""
  const words = spokenWords(o, best)
  const markdown = scriptToMarkdown(o, {
    hook: best,
    alternatives: ranked.slice(1).map((h) => ({ texto: h.hook, score: h.score })),
    input: input.data,
    words,
  })

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

      <Stagger className="flex flex-col gap-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Tempo estimado",
              value: runtime(words),
              hint: `${words} palavras a 150 por minuto`,
            },
            {
              label: "Duração alvo",
              value: `${input.data.duracao} min`,
              hint: input.data.publico,
            },
            {
              label: "Blocos",
              value: String(o.blocos.length),
              hint: "um assunto por bloco",
            },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-1 rounded-xl border border-border bg-card p-5">
              <span className="label">{s.label}</span>
              <span className="font-heading text-3xl font-extrabold tracking-[-0.03em] tabular-nums">{s.value}</span>
              <span className="truncate text-xs text-muted-foreground">{s.hint}</span>
            </div>
          ))}
        </div>

        <SectionCard
          title="Primeira frase (0:00 a 0:15)"
          term="notaGancho"
          description="Os primeiros 15 segundos são o trabalho todo. Nota baixa é motivo para revisar; nota alta não é promessa."
        >
          <ol className="flex flex-col gap-3">
            {ranked.map((h, i) => (
              <li
                key={h.hook}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border border-border p-3",
                  i < 2 && "border-primary/40 bg-primary/5",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{h.hook}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className={cn("tabular-nums", HOOK_BAND_TONE[h.band])}>
                      {h.score} · {BAND_LABEL[h.band]}
                    </Badge>
                    <CopyButton text={h.hook} what="Gancho" label="" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fórmula: {hooks.find((g) => g.texto === h.hook)?.formula ?? h.formula.nome} · Ponto fraco:{" "}
                  <strong className="font-semibold text-foreground">{h.weakest.label}</strong>, {h.weakest.fix}
                </p>
                {i < 2 ? (
                  <div className="grid grid-cols-5 gap-2">
                    {h.parts.map((p) => (
                      <div key={p.key} className="flex flex-col gap-1">
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${p.value}%` }} />
                        </div>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {p.label} {p.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard
          title="Virada (0:15 a 0:45)"
          hint="Logo depois da primeira frase: diga em uma frase o que o vídeo vai mostrar e já comece. Sem vinheta e sem pedir inscrição aqui, que é quando muita gente sai."
          description="O que o vídeo vai fazer, numa frase, e já começando. Sem vinheta, sem pedir inscrição."
        >
          <p className="text-[15px] leading-relaxed">{o.virada}</p>
        </SectionCard>

        <SectionCard
          title="Blocos"
          hint="O corpo do vídeo, dividido em partes. Cada parte tem o texto para falar e uma sugestão do que mostrar na tela (um exemplo, um gráfico, um texto)."
          description="Um assunto por bloco. O que aparece na tela vem marcado em cada um."
        >
          <ol className="flex flex-col gap-4">
            {o.blocos.map((b, i) => (
              <li key={`${i}-${b.titulo}`} className="flex flex-col gap-2 rounded-lg border border-border p-4">
                <span className="label">
                  {i + 1}. {b.titulo}
                </span>
                <p className="text-[15px] leading-relaxed whitespace-pre-line">{b.fala}</p>
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <strong className="font-semibold text-foreground">Na tela:</strong> {b.na_tela}
                </p>
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard title="Entrega e pedido final" description="Entregue o que o gancho prometeu e faça UM pedido.">
          <div className="flex flex-col gap-3 text-[15px] leading-relaxed">
            <p>{o.entrega}</p>
            <p className="rounded-lg bg-primary/10 p-3">
              <strong className="font-semibold">Pedido:</strong> {o.cta}
            </p>
          </div>
        </SectionCard>

        <p className="text-center text-xs text-muted-foreground">
          Gerado por IA com {creditsLabel(generation.credits_charged)}. Leia em voz alta e ajuste para a sua fala antes
          de gravar.
        </p>
      </Stagger>
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
