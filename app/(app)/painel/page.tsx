import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { AiStatusCard } from "@/components/ai/ai-status-card"
import { QuotaCard } from "@/components/youtube/quota-card"
import { requireUser } from "@/lib/auth/dal"
import { roleLabel } from "@/lib/navigation"

export const metadata: Metadata = { title: "Painel · CCD Studio" }

async function Welcome() {
  const user = await requireUser()
  const firstName = user.name.split(" ")[0]
  return (
    <PageHeader
      eyebrow={roleLabel[user.role]}
      title={firstName ? `Olá, ${firstName}` : "Painel"}
      description="Acompanhe suas gerações e acesse as ferramentas do CCD Studio."
      icon="dashboard"
    />
  )
}

async function AdminQuota() {
  const user = await requireUser()
  return (
    <>
      <QuotaCard user={user} />
      <AiStatusCard user={user} />
    </>
  )
}

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<PageHeader eyebrow="Visão geral" title="Painel" icon="dashboard" />}>
        <Welcome />
      </Suspense>
      <Suspense>
        <AdminQuota />
      </Suspense>
      <section className="rounded-xl border border-border bg-card p-6">
        <span className="label">Em breve</span>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          As ferramentas de IA (otimização, roteiro, thumbnail, shorts e capítulos) vão aparecer aqui.
        </p>
      </section>
    </>
  )
}
