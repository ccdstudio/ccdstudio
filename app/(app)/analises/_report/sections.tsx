import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { AuditResult } from "@/components/ai/audit-result"
import { Metric } from "@/components/shared/metric"
import { SectionCard } from "@/components/shared/section-card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { isAiConfigured } from "@/lib/ai/client"
import type { listGenerations } from "@/lib/ai/latest"
import { auditOutputSchema } from "@/lib/ai/prompts/audit"
import type { CurrentUser } from "@/lib/auth/dal"
import { AUDIT_THUMBNAILS_EXTRA, creditsLabel, FEATURE_COSTS } from "@/lib/credits/costs"
import { scoreTone } from "@/lib/status-colors"
import { cn } from "@/lib/utils"
import {
  engagement,
  titleSet,
  uploadRhythm,
  weekdayStats,
  type InsightVideo,
  type WeekdayStat,
} from "@/lib/youtube/channel-insights"
import { OutliersSection } from "./outliers-section"
import { VoiceCard } from "./voice-card"

// Seções do Relatório do canal (/analises). Cada aba é uma destas; o conteúdo veio das antigas
// páginas /analises/diagnostico, /estouros, /ritmo e /voz. Tudo calculado sem IA, exceto os resultados salvos.

type AuditHistory = Awaited<ReturnType<typeof listGenerations>>

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 })
const oneDecimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })

/* ------------------------------------------------------------------ resumo (sempre visível) */

/** 4 números que resumem o canal + o próximo passo do último diagnóstico (se houver). */
export function ReportSummary({ videos, audits }: { videos: InsightVideo[]; audits: AuditHistory }) {
  const titles = titleSet(videos)
  const rhythm = uploadRhythm(videos)
  const weekdays = weekdayStats(videos)
  const eng = engagement(videos)
  const latest = audits[0] ? auditOutputSchema.safeParse(audits[0].output) : null

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
        <Metric label="Nota dos títulos" term="notaTitulo" value={titles.averageScore === null ? "—" : `${titles.averageScore}/100`} hint="média dos últimos 10" />
        <Metric
          label="Melhor dia"
          term="melhorDia"
          value={weekdays.best ? <span className="capitalize">{weekdays.best.day}</span> : "sem padrão"}
          hint={weekdays.best ? `com base em ${weekdays.best.videos} vídeos` : "publique em dias variados"}
        />
        <Metric
          label="Entre um vídeo e outro"
          term="intervalo"
          value={rhythm.medianGapDays === null ? "—" : `${oneDecimal.format(rhythm.medianGapDays)} dias`}
          hint={`${rhythm.activeWeeks} de 12 semanas com vídeo`}
        />
        <Metric
          label="Engajamento"
          term="engajamento"
          value={eng.rate === null ? "—" : `${oneDecimal.format(eng.rate)}%`}
          hint="curtidas + comentários por view"
        />
      </div>

      {latest?.success ? (
        <Link
          href="/analises?aba=diagnostico"
          scroll={false}
          className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm transition-colors hover:bg-primary/10"
        >
          <span className="label shrink-0 text-primary">Próximo passo</span>
          <span className="min-w-0 flex-1 truncate font-semibold">{latest.data.correcao_principal.titulo}</span>
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.75} className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      ) : null}
    </section>
  )
}

/* ------------------------------------------------------------------ aba: diagnóstico */

export function DiagnosisTab({ videos, audits }: { videos: InsightVideo[]; audits: AuditHistory }) {
  const titles = titleSet(videos)
  const latest = audits[0] ? auditOutputSchema.safeParse(audits[0].output) : null
  const base = FEATURE_COSTS.audit

  return (
    <>
      {latest?.success ? (
        <AuditResult output={latest.data} createdAt={audits[0].created_at} credits={audits[0].credits_charged} />
      ) : (
        <section className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border bg-card p-6">
          <h2 className="text-lg font-bold">Nenhum diagnóstico ainda</h2>
          <p className="text-sm text-muted-foreground">
            Abaixo, uma primeira leitura dos seus títulos, feita sem IA. O diagnóstico por IA ({creditsLabel(base)}, ou{" "}
            {creditsLabel(base + AUDIT_THUMBNAILS_EXTRA)} com as miniaturas) junta tudo e diz qual é a UMA coisa a corrigir
            primeiro. Use o botão <strong>Gerar diagnóstico</strong> acima.
          </p>
        </section>
      )}

      <SectionCard
        title="Seus últimos 10 títulos"
        description={
          titles.sameShape
            ? "Quase todos seguem o mesmo jeito de título. Quando todos são iguais, o problema costuma ser o formato dos vídeos, não as palavras."
            : "Lidos juntos, do jeito que aparecem na página do seu canal. Clique num título para ver o que está bom e o que melhorar."
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric label="Nota média" term="notaTitulo" value={titles.averageScore === null ? "—" : `${titles.averageScore}/100`} />
            <Metric label="Jeitos de título diferentes" term="formula" value={titles.distinctFormulas} hint={`em ${titles.items.length} títulos`} />
            <Metric
              label="Problemas mais comuns"
              text="Os pontos que mais aparecem quando damos nota aos seus títulos. Ex.: 'celular' quer dizer que o título é cortado na tela do celular (mais de 40 letras)."
              value={titles.commonIssues[0]?.kind ?? "nenhum"}
              hint={
                titles.commonIssues.length
                  ? titles.commonIssues.map((c) => `${c.kind} (${c.n})`).join(" · ")
                  : undefined
              }
            />
          </div>
          <ol className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {titles.items.map((t) => (
              <li key={t.id}>
                <Collapsible>
                  <CollapsibleTrigger className="group flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50">
                    <Badge variant="outline" className={cn("w-10 justify-center tabular-nums", scoreTone(t.lint.score))}>
                      {t.lint.score}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{t.formula.nome}</span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={1.75}
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-90"
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="flex flex-col gap-1.5 px-3 pt-1 pb-3 pl-16 text-xs">
                      {t.lint.good.map((g) => (
                        <li key={g} className="flex items-start gap-1.5 text-muted-foreground">
                          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="mt-px size-3.5 shrink-0 text-success" />
                          {g}
                        </li>
                      ))}
                      {t.lint.issues.map((issue) => (
                        <li key={issue.kind + issue.message} className="flex items-start gap-1.5">
                          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="mt-px size-3.5 shrink-0 text-destructive" />
                          <span>
                            <strong className="font-semibold">{issue.kind}:</strong>{" "}
                            <span className="text-muted-foreground">{issue.message}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              </li>
            ))}
          </ol>
        </div>
      </SectionCard>

      {audits.length > 1 ? (
        <SectionCard title="Diagnósticos anteriores" description="O mais recente aparece no topo. Todos ficam também no Histórico.">
          <ul className="flex flex-col gap-2 text-sm">
            {audits.slice(1).map((h) => {
              const parsed = auditOutputSchema.safeParse(h.output)
              return (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                  <span className="min-w-0 flex-1 font-semibold">{parsed.success ? parsed.data.correcao_principal.titulo : "Diagnóstico"}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{dateTime.format(new Date(h.created_at))}</span>
                  <Link href={`/historico/${h.id}`} className={buttonVariants({ variant: "outline", size: "xs" })}>
                    Abrir
                  </Link>
                </li>
              )
            })}
          </ul>
        </SectionCard>
      ) : null}
    </>
  )
}

/* ------------------------------------------------------------------ aba: estouros */

export function OutliersTab({ user, videos }: { user: CurrentUser; videos: InsightVideo[] }) {
  return <OutliersSection userId={user.id} videos={videos} canGenerate={isAiConfigured()} />
}

/* ------------------------------------------------------------------ aba: ritmo */

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

export function RhythmTab({ videos }: { videos: InsightVideo[] }) {
  const rhythm = uploadRhythm(videos)
  const weekdays = weekdayStats(videos)
  const eng = engagement(videos)

  return (
    <>
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric
              label="Melhor dia"
              term="melhorDia"
              value={weekdays.best ? <span className="capitalize">{weekdays.best.day}</span> : "ainda sem padrão"}
              hint={weekdays.best ? `com base em ${weekdays.best.videos} vídeos` : "publique em dias variados para descobrir"}
            />
            <Metric label="Shorts × longos" term="shortsLongos" value={`${eng.shorts} × ${eng.longs}`} />
            <Metric
              label="Engajamento"
              term="engajamento"
              value={eng.rate === null ? "—" : `${oneDecimal.format(eng.rate)}%`}
              hint={eng.rate === null ? undefined : `de cada 100 views, cerca de ${oneDecimal.format(eng.rate)} viram curtida ou comentário`}
            />
          </div>
        </div>
      </SectionCard>
    </>
  )
}

/* ------------------------------------------------------------------ aba: voz */

export function VoiceTab({ user }: { user: CurrentUser }) {
  return <VoiceCard user={user} />
}
