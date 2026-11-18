import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { isAiConfigured } from "@/lib/ai/client"
import { requireUser } from "@/lib/auth/dal"
import { getCreditBalance } from "@/lib/credits/balance"
import { creditsLabel, FEATURE_COSTS } from "@/lib/credits/costs"
import { NOTICE } from "@/lib/status-colors"
import { PlanWizard } from "./plan-wizard"

export const metadata: Metadata = { title: "Novo plano da semana · CCD Studio" }

const HEADER = {
  eyebrow: "Calendário editorial",
  title: "Novo plano da semana",
  icon: "calendar" as const,
  help: "calendario-novo" as const,
  description: "Responda 4 perguntas. A IA monta a semana: 1 vídeo principal, 1 simples e 3 Shorts, no tempo que você tem.",
}
const COST = FEATURE_COSTS.plan

async function Wizard() {
  const user = await requireUser()
  const balance = await getCreditBalance(user.id)
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
      <PlanWizard cost={creditsLabel(COST)} blocked={blocked} />
    </>
  )
}

export default function NewPlanPage() {
  return (
    <>
      <PageHeader {...HEADER} back={{ href: "/calendario" }} />
      <Suspense fallback={<div className="mx-auto h-96 w-full max-w-3xl animate-pulse rounded-2xl border border-border bg-card" />}>
        <Wizard />
      </Suspense>
    </>
  )
}
