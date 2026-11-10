import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { isAiConfigured } from "@/lib/ai/client"
import { DEFAULT_NICHE } from "@/lib/ai/prompts/metadata"
import { getVoiceProfile } from "@/lib/ai/voice"
import { requireUser } from "@/lib/auth/dal"
import { getCreditBalance } from "@/lib/credits/balance"
import { creditsLabel, FEATURE_COSTS } from "@/lib/credits/costs"
import { NOTICE } from "@/lib/status-colors"
import { OptimizationWizard } from "./optimization-wizard"

export const metadata: Metadata = { title: "Nova otimização · CCD Studio" }

const HEADER = {
  eyebrow: "Otimização de vídeo",
  title: "Nova otimização",
  icon: "optimize" as const,
  help: "otimizacao-nova" as const,
  description: "Responda 3 perguntas rápidas. A IA cria títulos, miniatura, descrição e tags para o seu vídeo.",
}
const COST = FEATURE_COSTS.metadata

async function Wizard() {
  const user = await requireUser()
  const [voice, balance] = await Promise.all([getVoiceProfile(user.id), getCreditBalance(user.id)])
  const blocked = !isAiConfigured()
    ? "As ferramentas de IA ainda não foram configuradas."
    : balance.total < COST
      ? "Você está sem créditos. Os créditos gratuitos renovam no dia 1."
      : null

  return (
    <>
      {blocked ? (
        <p role="status" className={NOTICE.warning}>
          {blocked}
        </p>
      ) : null}
      <OptimizationWizard niche={voice?.niche || DEFAULT_NICHE} cost={creditsLabel(COST)} blocked={blocked} />
    </>
  )
}

export default function NewOptimizationPage() {
  return (
    <>
      <PageHeader {...HEADER} back={{ href: "/criar/otimizacao" }} />
      <Suspense fallback={<div className="mx-auto h-96 w-full max-w-3xl animate-pulse rounded-2xl border border-border bg-card" />}>
        <Wizard />
      </Suspense>
    </>
  )
}
