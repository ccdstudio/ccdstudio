import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { isAiConfigured } from "@/lib/ai/client"
import { listGenerations } from "@/lib/ai/latest"
import { requireUser } from "@/lib/auth/dal"
import { getCreditBalance } from "@/lib/credits/balance"
import { AUDIT_THUMBNAILS_EXTRA, FEATURE_COSTS } from "@/lib/credits/costs"
import { getMyChannelData } from "@/lib/youtube/channel-data"
import { AuditDialog } from "./_report/audit-dialog"
import { ANALYSIS_EYEBROW, NoChannel } from "./_report/no-channel"
import { ReportTabs } from "./_report/report-tabs"
import { DiagnosisTab, OutliersTab, ReportSummary, RhythmTab, VoiceTab } from "./_report/sections"

export const metadata: Metadata = { title: "Relatório do canal · CCD Studio" }

const HEADER = { eyebrow: ANALYSIS_EYEBROW, title: "Relatório do canal", icon: "report" as const, help: "relatorio" as const }
const DESCRIPTION = "Tudo sobre o seu canal num lugar só: o que corrigir primeiro, o que já funciona, quando publicar e o seu jeito de falar."

// Relatório do canal: resumo sempre visível + uma aba por análise (antes eram 4 páginas no menu).
async function Report() {
  const user = await requireUser()
  const data = await getMyChannelData(user.youtube_channel_id)

  // Sem canal: só a aba de voz funciona (o perfil pode ser escrito à mão).
  if (!data) {
    const noChannel = <NoChannel what="Esta análise" />
    return (
      <>
        <PageHeader {...HEADER} description={DESCRIPTION} />
        <ReportTabs panels={{ diagnostico: noChannel, estouros: noChannel, ritmo: noChannel, voz: <VoiceTab user={user} /> }} />
      </>
    )
  }

  const { channel, videos } = data
  const [audits, balance] = await Promise.all([listGenerations(user.id, "audit", 10), getCreditBalance(user.id)])
  const base = FEATURE_COSTS.audit
  const canAudit = isAiConfigured() && videos.length >= 3 && balance.total >= base

  return (
    <>
      <PageHeader
        {...HEADER}
        description={`${channel.title} · ${DESCRIPTION.charAt(0).toLowerCase()}${DESCRIPTION.slice(1)}`}
        actions={<AuditDialog base={base} extra={AUDIT_THUMBNAILS_EXTRA} disabled={!canAudit} />}
      />
      <ReportSummary videos={videos} audits={audits} />
      <ReportTabs
        panels={{
          diagnostico: <DiagnosisTab videos={videos} audits={audits} />,
          estouros: <OutliersTab user={user} videos={videos} />,
          ritmo: <RhythmTab videos={videos} />,
          voz: <VoiceTab user={user} />,
        }}
      />
    </>
  )
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} description="Carregando…" />
          <div className="h-28 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Report />
    </Suspense>
  )
}
