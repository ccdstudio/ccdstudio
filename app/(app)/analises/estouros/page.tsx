import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { isAiConfigured } from "@/lib/ai/client"
import { requireUser } from "@/lib/auth/dal"
import { getMyChannelData } from "@/lib/youtube/channel-data"
import { ANALYSIS_EYEBROW, NoChannel } from "../no-channel"
import { OutliersSection } from "./outliers-section"

export const metadata: Metadata = { title: "Vídeos que estouraram · CCD Studio" }

const HEADER = { eyebrow: ANALYSIS_EYEBROW, title: "Vídeos que estouraram", icon: "outliers" as const, help: "estouros" as const }

async function Outliers() {
  const user = await requireUser()
  const data = await getMyChannelData(user.youtube_channel_id)

  return (
    <>
      <PageHeader {...HEADER} description="Quais vídeos seus foram muito melhor que o normal do seu canal, e o que eles têm em comum." />
      {data ? (
        <OutliersSection userId={user.id} videos={data.videos} canGenerate={isAiConfigured()} />
      ) : (
        <NoChannel what="Esta análise" />
      )}
    </>
  )
}

export default function OutliersPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} description="Carregando…" />
          <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Outliers />
    </Suspense>
  )
}
