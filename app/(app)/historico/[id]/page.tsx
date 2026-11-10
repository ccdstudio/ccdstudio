import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"
import { AuditResult } from "@/components/ai/audit-result"
import { IdeasResult } from "@/components/ai/ideas-result"
import { PageHeader } from "@/components/layout/page-header"
import { DataList } from "@/components/shared/data-list"
import { SectionCard } from "@/components/shared/section-card"
import { Badge } from "@/components/ui/badge"
import { toolInfo } from "@/lib/ai/history"
import { auditOutputSchema } from "@/lib/ai/prompts/audit"
import { ideasOutputSchema } from "@/lib/ai/prompts/ideas"
import { voiceOutputSchema } from "@/lib/ai/prompts/voice"
import { requireUser } from "@/lib/auth/dal"
import { creditsLabel } from "@/lib/credits/costs"
import { NOTICE } from "@/lib/status-colors"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Histórico · CCD Studio" }

const HEADER = { eyebrow: "Histórico", icon: "history" as const, help: "historico-item" as const }
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" })


function Chips({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Badge key={i} variant="outline" className="font-medium">
          {i}
        </Badge>
      ))}
    </span>
  )
}

function Body({ feature, output, createdAt, credits }: { feature: string; output: unknown; createdAt: string; credits: number }) {
  if (feature === "audit") {
    const parsed = auditOutputSchema.safeParse(output)
    if (parsed.success) return <AuditResult output={parsed.data} createdAt={createdAt} credits={credits} />
  }
  if (feature === "ideas") {
    const parsed = ideasOutputSchema.safeParse(output)
    if (parsed.success)
      return (
        <section className="rounded-xl border border-border bg-card p-6">
          <IdeasResult output={parsed.data} createdAt={createdAt} />
        </section>
      )
  }
  if (feature === "voice") {
    const parsed = voiceOutputSchema.safeParse(output)
    if (parsed.success) {
      const v = parsed.data
      return (
        <>
          <p role="status" className={NOTICE.info}>
            Esta é a versão gerada nesta data. O seu perfil atual pode ter sido editado depois.{" "}
            <Link href="/analises/voz" className="font-semibold underline">
              Ver perfil atual
            </Link>
          </p>
          <SectionCard title="Perfil gerado" description="Como a IA descreveu o seu jeito de falar, a partir do seu canal.">
            <DataList
              items={[
                { label: "Assunto do canal", value: v.nicho },
                { label: "Para quem você fala", value: v.publico },
                { label: "Tom", value: v.tom, wide: true },
                { label: "Palavras que você usa", value: <Chips items={v.usa} />, wide: true },
                { label: "Palavras que você evita", value: <Chips items={v.evita} />, wide: true },
                { label: "O que você não afirma", value: v.nao_afirma.join("\n"), wide: true },
                { label: "Formato dos vídeos", value: v.formato, wide: true },
              ]}
            />
          </SectionCard>
        </>
      )
    }
  }
  return (
    <section className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
      Não foi possível mostrar esta geração. Ela foi feita numa versão antiga da ferramenta.
    </section>
  )
}

async function Result({ params }: { params: PageProps<"/historico/[id]">["params"] }) {
  const user = await requireUser()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const supabase = await createClient()
  const { data: generation } = await supabase
    .from("ai_generations")
    .select("id, feature, created_at, output, credits_charged")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!generation) notFound()

  // Otimização e Roteiro já têm página própria.
  if (generation.feature === "metadata" || generation.feature === "script") {
    redirect(toolInfo(generation.feature)!.href(generation.id))
  }

  const info = toolInfo(generation.feature)
  return (
    <>
      <PageHeader
        {...HEADER}
        title={info?.label ?? generation.feature}
        description={`Gerado em ${dateFmt.format(new Date(generation.created_at))} · ${creditsLabel(generation.credits_charged)}`}
        back={{ href: "/historico" }}
      />
      <Body
        feature={generation.feature}
        output={generation.output}
        createdAt={generation.created_at}
        credits={generation.credits_charged}
      />
    </>
  )
}

export default function HistoryItemPage({ params }: PageProps<"/historico/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} title="Carregando…" />
          <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Result params={params} />
    </Suspense>
  )
}
