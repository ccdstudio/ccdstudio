import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { isAiConfigured } from "@/lib/ai/client"
import { requireUser } from "@/lib/auth/dal"
import { getCreditBalance } from "@/lib/credits/balance"
import { creditsLabel, FEATURE_COSTS } from "@/lib/credits/costs"
import { NOTICE } from "@/lib/status-colors"
import { ThumbnailWizard } from "./thumbnail-wizard"

export const metadata: Metadata = { title: "Nova thumbnail · CCD Studio" }
// Texto + imagem podem passar de 1 minuto.
export const maxDuration = 120

const HEADER = {
  eyebrow: "Thumbnail",
  title: "Nova thumbnail",
  icon: "thumbnail" as const,
  help: "thumbnail-nova" as const,
  description: "Responda 5 perguntas. A IA cria a ideia da capa, escreve o prompt e desenha a imagem em 1280×720.",
}
const COST = FEATURE_COSTS.thumbnail

async function Wizard() {
  const user = await requireUser()
  const balance = await getCreditBalance(user.id)
  const blocked = !isAiConfigured()
    ? "As ferramentas de IA ainda não foram configuradas."
    : balance.total < COST
      ? `Você precisa de ${creditsLabel(COST)} para gerar uma capa. Os créditos gratuitos renovam no dia 1.`
      : null

  return (
    <>
      {blocked ? (
        <p role="status" className={NOTICE.warning}>
          {blocked}
        </p>
      ) : null}
      <ThumbnailWizard cost={creditsLabel(COST)} blocked={blocked} />
    </>
  )
}

export default function NewThumbnailPage() {
  return (
    <>
      <PageHeader {...HEADER} back={{ href: "/criar/thumbnail" }} />
      <Suspense fallback={<div className="mx-auto h-96 w-full max-w-3xl animate-pulse rounded-2xl border border-border bg-card" />}>
        <Wizard />
      </Suspense>
    </>
  )
}
