import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { isAiConfigured } from "@/lib/ai/client"
import { DEFAULT_NICHE } from "@/lib/ai/prompts/metadata"
import { getVoiceProfile } from "@/lib/ai/voice"
import { requireUser } from "@/lib/auth/dal"
import { getCreditBalance } from "@/lib/credits/balance"
import { creditsLabel, VIDEO_PACKAGE_COST } from "@/lib/credits/costs"
import { NOTICE } from "@/lib/status-colors"
import { VideoWizard } from "./video-wizard"

export const metadata: Metadata = { title: "Novo vídeo completo · CCD Studio" }
// Briefing + otimização, roteiro e capa em paralelo: ~1 min 15 s, com folga para nova tentativa.
export const maxDuration = 300

const HEADER = {
  eyebrow: "Vídeo completo",
  title: "Novo vídeo completo",
  icon: "video" as const,
  help: "video-novo" as const,
  description: "Conte sobre o vídeo em poucas linhas. A IA entrega título, descrição e SEO, o roteiro inteiro e a thumbnail.",
}

async function Wizard({ searchParams }: { searchParams: PageProps<"/criar/video/novo">["searchParams"] }) {
  const user = await requireUser()
  const params = await searchParams
  const [voice, balance] = await Promise.all([getVoiceProfile(user.id), getCreditBalance(user.id)])
  const blocked = !isAiConfigured()
    ? "As ferramentas de IA ainda não foram configuradas."
    : balance.total < VIDEO_PACKAGE_COST
      ? `Você precisa de ${creditsLabel(VIDEO_PACKAGE_COST)} para o vídeo completo. Os créditos gratuitos renovam no dia 1.`
      : null

  return (
    <>
      {blocked ? (
        <p role="status" className={NOTICE.warning}>
          {blocked}
        </p>
      ) : null}
      <VideoWizard
        niche={voice?.niche || DEFAULT_NICHE}
        cost={creditsLabel(VIDEO_PACKAGE_COST)}
        blocked={blocked}
        // Pré-preenchimento vindo de outras páginas (ex.: Calendário editorial).
        prefill={typeof params.assunto === "string" ? params.assunto.slice(0, 1500) : undefined}
      />
    </>
  )
}

export default function NewVideoPage({ searchParams }: PageProps<"/criar/video/novo">) {
  return (
    <>
      <PageHeader {...HEADER} back={{ href: "/criar/video" }} />
      <Suspense fallback={<div className="mx-auto h-96 w-full max-w-3xl animate-pulse rounded-2xl border border-border bg-card" />}>
        <Wizard searchParams={searchParams} />
      </Suspense>
    </>
  )
}
