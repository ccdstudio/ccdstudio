import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
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

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<PageHeader eyebrow="Visão geral" title="Painel" icon="dashboard" />}>
        <Welcome />
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
