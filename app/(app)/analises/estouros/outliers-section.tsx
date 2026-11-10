import { IdeasResult } from "@/components/ai/ideas-result"
import { RunActionButton } from "@/components/ai/run-action-button"
import { InfoHint } from "@/components/shared/info-hint"
import { SectionCard } from "@/components/shared/section-card"
import { Badge } from "@/components/ui/badge"
import { getLatestGeneration } from "@/lib/ai/latest"
import { ideasOutputSchema } from "@/lib/ai/prompts/ideas"
import { creditsLabel, FEATURE_COSTS } from "@/lib/credits/costs"
import { cn } from "@/lib/utils"
import { commonPattern, OUTLIER_MIN, outliers, type InsightVideo, type OutlierGroup } from "@/lib/youtube/channel-insights"
import { formulaById } from "@/lib/youtube/formulas"
import { generateIdeas } from "./actions"

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 })
const multipleFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })

function minutes(seconds: number | null) {
  if (seconds === null) return null
  return seconds < 60 ? `${Math.round(seconds)} s` : `${Math.round(seconds / 60)} min`
}

function Group({ group, title }: { group: OutlierGroup; title: string }) {
  if (!group.count) return null
  const pattern = group.enough ? commonPattern(group.top) : null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold">{title}</h3>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          {group.count} vídeos · normal do canal: {group.median === null ? "—" : compact.format(group.median)} views
          <InfoHint term="mediana" label="Normal do canal (mediana)" />
        </span>
      </div>

      {!group.enough ? (
        <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
          Poucos vídeos para comparar ({group.count}). A mediana só faz sentido com pelo menos 4.
        </p>
      ) : (
        <>
          <ol className="flex flex-col gap-2">
            {group.top.map((v) => (
              <li key={v.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                <Badge
                  title="Quantas vezes superou um vídeo típico seu"
                  variant="outline"
                  className={cn(
                    "w-14 justify-center tabular-nums",
                    v.multiple >= OUTLIER_MIN ? "border-transparent bg-primary text-primary-foreground" : undefined
                  )}
                >
                  {multipleFmt.format(v.multiple)}×
                </Badge>
                {v.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumbnail_url} alt="" referrerPolicy="no-referrer" loading="lazy" className="hidden aspect-video w-20 shrink-0 rounded-md object-cover sm:block" />
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col">
                  <a
                    href={`https://www.youtube.com/watch?v=${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm font-semibold hover:underline"
                  >
                    {v.title}
                  </a>
                  <span className="inline-flex flex-wrap items-center gap-1 text-xs text-muted-foreground tabular-nums">
                    {compact.format(v.view_count ?? 0)} views · jeito do título: {v.formula.nome}
                    <InfoHint
                      label={v.formula.nome}
                      text={
                        formulaById(v.formula.id)
                          ? `${formulaById(v.formula.id)!.forma} Exemplo: "${formulaById(v.formula.id)!.exemplo}".`
                          : "O título não segue nenhum dos 21 formatos conhecidos. Isso não é ruim por si só."
                      }
                    />
                  </span>
                </div>
              </li>
            ))}
          </ol>
          {pattern ? (
            <p className="text-sm text-muted-foreground">
              <strong className="font-semibold text-foreground">Em comum nos {pattern.count} estouros:</strong>{" "}
              {[
                pattern.formula ? `fórmula “${pattern.formula.nome}” (${pattern.formula.vezes}×)` : null,
                pattern.medianDuration !== null ? `duração típica de ${minutes(pattern.medianDuration)}` : null,
                pattern.weekday ? `${pattern.weekday.vezes} publicados numa ${pattern.weekday.nome}` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "nenhum padrão claro de título, duração ou dia."}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum vídeo passou de {multipleFmt.format(OUTLIER_MIN)}× a mediana: o canal está regular.</p>
          )}
        </>
      )}
    </div>
  )
}

/** Vídeos que estouraram (skill yt-viral no próprio canal) + próximas ideias por IA. */
export async function OutliersSection({ userId, videos, canGenerate }: { userId: string; videos: InsightVideo[]; canGenerate: boolean }) {
  const o = outliers(videos)
  const latest = await getLatestGeneration(userId, "ideas")
  const ideas = latest ? ideasOutputSchema.safeParse(latest.output) : null
  const cost = FEATURE_COSTS.ideas
  const anyEnough = o.longos.enough || o.shorts.enough

  return (
    <SectionCard
      title="Os 5 que mais superaram o normal"
      description="O número em destaque diz quantas vezes o vídeo superou um vídeo típico seu. Em azul, os que passaram de 1,5×."
      actions={
        <RunActionButton
          action={generateIdeas}
          label={`${ideas?.success ? "Novas ideias" : "Gerar próximas ideias"} · ${creditsLabel(cost)}`}
          pendingLabel="Pensando nas ideias…"
          disabled={!canGenerate || !anyEnough}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <Group group={o.longos} title="Vídeos longos" />
        <Group group={o.shorts} title="Shorts" />

        {ideas?.success && latest ? (
          <div className="border-t border-border pt-5">
            <IdeasResult output={ideas.data} createdAt={latest.created_at} />
          </div>
        ) : null}
      </div>
    </SectionCard>
  )
}
