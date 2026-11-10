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
import { ScriptWizard } from "./script-wizard"

export const metadata: Metadata = { title: "Novo roteiro · CCD Studio" }

const HEADER = {
  eyebrow: "Roteiro",
  title: "Novo roteiro",
  icon: "script" as const,
  help: "roteiro-novo" as const,
  description: "Responda 4 perguntas rápidas. A IA escreve o roteiro inteiro, do gancho ao pedido final.",
}
const COST = FEATURE_COSTS.script
const param = (v: string | string[] | undefined) => (typeof v === "string" ? v.slice(0, 500) : undefined)

async function Wizard({ searchParams }: { searchParams: PageProps<"/criar/roteiro/novo">["searchParams"] }) {
  const user = await requireUser()
  const params = await searchParams
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
      <ScriptWizard
        niche={voice?.niche || DEFAULT_NICHE}
        cost={creditsLabel(COST)}
        blocked={blocked}
        // Pré-preenchimento vindo de outras páginas (ex.: ideias de vídeos).
        prefill={{ tema: param(params.tema), publico: param(params.publico), objetivo: param(params.objetivo) }}
      />
    </>
  )
}

export default function NewScriptPage({ searchParams }: PageProps<"/criar/roteiro/novo">) {
  return (
    <>
      <PageHeader {...HEADER} back={{ href: "/criar/roteiro" }} />
      <Suspense fallback={<div className="mx-auto h-96 w-full max-w-3xl animate-pulse rounded-2xl border border-border bg-card" />}>
        <Wizard searchParams={searchParams} />
      </Suspense>
    </>
  )
}
