import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { PageHeader } from "@/components/layout/page-header"
import { InfoHint } from "@/components/shared/info-hint"
import { SectionCard } from "@/components/shared/section-card"
import { AuditResult } from "@/components/ai/audit-result"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { isAiConfigured } from "@/lib/ai/client"
import { listGenerations } from "@/lib/ai/latest"
import { auditOutputSchema } from "@/lib/ai/prompts/audit"
import { requireUser } from "@/lib/auth/dal"
import { getCreditBalance } from "@/lib/credits/balance"
import { AUDIT_THUMBNAILS_EXTRA, creditsLabel, FEATURE_COSTS } from "@/lib/credits/costs"
import { scoreTone } from "@/lib/status-colors"
import { cn } from "@/lib/utils"
import { titleSet } from "@/lib/youtube/channel-insights"
import { getMyChannelData } from "@/lib/youtube/channel-data"
import type { GlossaryKey } from "@/lib/youtube/glossary"
import { ANALYSIS_EYEBROW, NoChannel } from "../no-channel"
import { AuditDialog } from "./audit-dialog"

export const metadata: Metadata = { title: "Diagnóstico do canal · CCD Studio" }

const HEADER = { eyebrow: ANALYSIS_EYEBROW, title: "Diagnóstico do canal", icon: "diagnosis" as const, help: "diagnostico" as const }
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })

function Metric({ label, value, hint, term, text }: { label: string; value: React.ReactNode; hint?: string; term?: GlossaryKey; text?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="label flex items-center gap-1">
        {label}
        <InfoHint term={term} text={text} label={label} />
      </span>
      <span className="font-heading text-xl font-bold tracking-[-0.02em] tabular-nums">{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}

async function Diagnosis() {
  const user = await requireUser()
  const data = await getMyChannelData(user.youtube_channel_id)

  if (!data) {
    return (
      <>
        <PageHeader {...HEADER} description="Uma correção principal para o seu canal, a partir dos dados públicos." />
        <NoChannel what="O diagnóstico" />
      </>
    )
  }

  const { channel, videos } = data
  const titles = titleSet(videos)
  const [history, balance] = await Promise.all([listGenerations(user.id, "audit", 10), getCreditBalance(user.id)])
  const latest = history[0] ? auditOutputSchema.safeParse(history[0].output) : null
  const base = FEATURE_COSTS.audit
  const canGenerate = isAiConfigured() && videos.length >= 3 && balance.total >= base

  return (
    <>
      <PageHeader
        {...HEADER}
        description={`${channel.title} · o que corrigir primeiro, o que já funciona e o que não fazer agora.`}
        actions={<AuditDialog base={base} extra={AUDIT_THUMBNAILS_EXTRA} disabled={!canGenerate} />}
      />

      {/* Resultado da IA */}
      {latest?.success ? (
        <AuditResult output={latest.data} createdAt={history[0].created_at} credits={history[0].credits_charged} />
      ) : (
        <section className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border bg-card p-6">
          <h2 className="text-lg font-bold">Nenhum diagnóstico ainda</h2>
          <p className="text-sm text-muted-foreground">
            Abaixo, uma primeira leitura dos seus títulos, feita sem IA. O diagnóstico por IA ({creditsLabel(base)}, ou {creditsLabel(base + AUDIT_THUMBNAILS_EXTRA)} com as
            miniaturas) junta tudo e diz qual é a UMA coisa a corrigir primeiro.
          </p>
        </section>
      )}

      {/* Títulos como conjunto */}
      <SectionCard
        title="Seus últimos 10 títulos"
        description={
          titles.sameShape
            ? "Quase todos seguem o mesmo jeito de título. Quando todos são iguais, o problema costuma ser o formato dos vídeos, não as palavras."
            : "Lidos juntos, do jeito que aparecem na página do seu canal. A nota de cada um aparece à esquerda."
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric label="Nota média" term="notaTitulo" value={titles.averageScore === null ? "—" : `${titles.averageScore}/100`} />
            <Metric label="Jeitos de título diferentes" term="formula" value={titles.distinctFormulas} hint={`em ${titles.items.length} títulos`} />
            <Metric
              label="Problema mais comum"
              text="O ponto que mais aparece quando damos nota aos seus títulos. Ex.: 'celular' quer dizer que o título é cortado na tela do celular (mais de 40 letras)."
              value={titles.commonIssues[0]?.kind ?? "nenhum"}
              hint={titles.commonIssues[0] ? `${titles.commonIssues[0].n} de ${titles.items.length} títulos` : undefined}
            />
          </div>
          <ol className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {titles.items.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <Badge variant="outline" className={cn("w-10 justify-center tabular-nums", scoreTone(t.lint.score))}>
                  {t.lint.score}
                </Badge>
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{t.formula.nome}</span>
              </li>
            ))}
          </ol>
        </div>
      </SectionCard>

      <Link
        href="/analises/ritmo"
        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-sm transition-colors hover:bg-muted/50"
      >
        <span>
          <strong className="font-semibold">Quer ver o seu ritmo de publicação e o melhor dia para postar?</strong>{" "}
          <span className="text-muted-foreground">Está em Melhor dia e ritmo.</span>
        </span>
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.75} className="size-4 shrink-0 text-muted-foreground" />
      </Link>

      {history.length > 1 ? (
        <SectionCard title="Diagnósticos anteriores" description="O mais recente aparece no topo da página. Todos ficam também no Histórico.">
          <ul className="flex flex-col gap-2 text-sm">
            {history.slice(1).map((h) => {
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

export default function DiagnosisPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} description="Carregando…" />
          <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Diagnosis />
    </Suspense>
  )
}
