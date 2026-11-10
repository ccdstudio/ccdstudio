import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { InfoHint } from "@/components/shared/info-hint"
import { SectionCard } from "@/components/shared/section-card"
import { requireUser } from "@/lib/auth/dal"
import { cn } from "@/lib/utils"
import { engagement, uploadRhythm, weekdayStats, type WeekdayStat } from "@/lib/youtube/channel-insights"
import { getMyChannelData } from "@/lib/youtube/channel-data"
import type { GlossaryKey } from "@/lib/youtube/glossary"
import { ANALYSIS_EYEBROW, NoChannel } from "../no-channel"

export const metadata: Metadata = { title: "Melhor dia e ritmo · CCD Studio" }

const HEADER = { eyebrow: ANALYSIS_EYEBROW, title: "Melhor dia e ritmo", icon: "rhythm" as const, help: "ritmo" as const }
const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 })
const oneDecimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })

function Metric({ label, value, hint, term }: { label: string; value: React.ReactNode; hint?: string; term: GlossaryKey }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="label flex items-center gap-1">
        {label}
        <InfoHint term={term} label={label} />
      </span>
      <span className="font-heading text-xl font-bold tracking-[-0.02em] tabular-nums">{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}

/** Mediana de views por dia da semana (série única; tooltip por barra; rótulos em tokens de texto). */
function WeekdayChart({ stats, best }: { stats: WeekdayStat[]; best: WeekdayStat | null }) {
  const max = Math.max(...stats.map((s) => s.medianViews ?? 0), 1)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-36 items-end gap-0.5 border-b border-border" role="img" aria-label="Views típicas por dia da semana">
        {stats.map((s) => (
          <div key={s.day} className="group relative flex h-full min-w-0 flex-1 items-end" tabIndex={0}>
            <div
              className="w-full rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80"
              style={{ height: `${s.medianViews ? Math.max(2, (s.medianViews / max) * 100) : 0}%` }}
            />
            <div
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-44 -translate-x-1/2 rounded-lg border border-border bg-popover p-2 text-xs text-popover-foreground shadow-sm group-hover:block group-focus-visible:block"
            >
              <p className="font-semibold capitalize">{s.day}</p>
              <p className="text-muted-foreground tabular-nums">
                {s.medianViews === null ? "nenhum vídeo neste dia" : `${compact.format(s.medianViews)} views num vídeo típico`} · {s.videos}{" "}
                {s.videos === 1 ? "vídeo" : "vídeos"}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-0.5 text-center text-xs text-muted-foreground">
        {stats.map((s) => (
          <span key={s.day} className={cn("flex-1 capitalize", best?.day === s.day && "font-semibold text-foreground")}>
            {s.day.slice(0, 3)}
          </span>
        ))}
      </div>
    </div>
  )
}

async function Rhythm() {
  const user = await requireUser()
  const data = await getMyChannelData(user.youtube_channel_id)

  const header = (
    <>
      <PageHeader {...HEADER} description="Quando você publica, com que regularidade, e qual dia costuma render mais views." />
    </>
  )
  if (!data) return (
    <>
      {header}
      <NoChannel what="Esta análise" />
    </>
  )

  const rhythm = uploadRhythm(data.videos)
  const weekdays = weekdayStats(data.videos)
  const eng = engagement(data.videos)

  return (
    <>
      {header}
      <SectionCard title="Ritmo de publicação" description="Cada quadrado é uma semana; o número mostra quantos vídeos saíram nela.">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric
              label="Entre um vídeo e outro"
              term="intervalo"
              value={rhythm.medianGapDays === null ? "—" : `${oneDecimal.format(rhythm.medianGapDays)} dias`}
              hint="o normal do canal"
            />
            <Metric label="Maior pausa" term="maiorPausa" value={rhythm.longestGapDays === null ? "—" : `${Math.round(rhythm.longestGapDays)} dias`} />
            <Metric label="Semanas com vídeo" term="semanasComVideo" value={`${rhythm.activeWeeks} de 12`} />
            <Metric
              label="Último vídeo"
              term="ultimoVideo"
              value={rhythm.daysSinceLast === null ? "—" : rhythm.daysSinceLast === 0 ? "hoje" : `há ${rhythm.daysSinceLast} dias`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1" aria-label="Vídeos publicados em cada uma das últimas 12 semanas, da mais antiga para a atual">
              {rhythm.weeks.map((w) => (
                <div
                  key={w.index}
                  title={`${w.uploads} ${w.uploads === 1 ? "vídeo" : "vídeos"}`}
                  className={cn(
                    "flex h-8 flex-1 items-center justify-center rounded-md text-xs tabular-nums",
                    w.uploads ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {w.uploads}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>12 semanas atrás</span>
              <span>esta semana</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Melhor dia para publicar"
        description={`Views de um vídeo típico seu em cada dia da semana (${weekdays.basis === "longos" ? "só vídeos longos" : "todos os vídeos"}). Passe o mouse nas barras.`}
      >
        <div className="flex flex-col gap-5">
          <WeekdayChart stats={weekdays.stats} best={weekdays.best} />
          <div className="grid grid-cols-2 gap-4">
            <Metric
              label="Melhor dia"
              term="melhorDia"
              value={weekdays.best ? <span className="capitalize">{weekdays.best.day}</span> : "ainda sem padrão"}
              hint={weekdays.best ? `com base em ${weekdays.best.videos} vídeos` : "publique em dias variados para descobrir"}
            />
            <Metric label="Shorts × longos" term="shortsLongos" value={`${eng.shorts} × ${eng.longs}`} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Engajamento" description="Se quem assiste também curte e comenta.">
        <Metric
          label="Engajamento"
          term="engajamento"
          value={eng.rate === null ? "—" : `${oneDecimal.format(eng.rate)}%`}
          hint={eng.rate === null ? undefined : `de cada 100 views, cerca de ${oneDecimal.format(eng.rate)} viram curtida ou comentário`}
        />
      </SectionCard>
    </>
  )
}

export default function RhythmPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} description="Carregando…" />
          <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Rhythm />
    </Suspense>
  )
}
