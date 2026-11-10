import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { requireUser } from "@/lib/auth/dal"
import { ANALYSIS_EYEBROW } from "../no-channel"
import { VoiceCard } from "./voice-card"

export const metadata: Metadata = { title: "Seu jeito de falar · CCD Studio" }

const HEADER = { eyebrow: ANALYSIS_EYEBROW, title: "Seu jeito de falar", icon: "voice" as const, help: "voz" as const }

async function Voice() {
  const user = await requireUser()
  return (
    <>
      <PageHeader {...HEADER} description="Ensina a IA a escrever do jeito que você fala, para os títulos e roteiros soarem como você." />
      <VoiceCard user={user} />
    </>
  )
}

export default function VoicePage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} description="Carregando…" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Voice />
    </Suspense>
  )
}
