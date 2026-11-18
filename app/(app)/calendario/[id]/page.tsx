import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { NewGenerationLink } from "@/components/ai/new-generation-link"
import { PlanWeek, sortedItems } from "@/components/ai/plan-week"
import { PageHeader } from "@/components/layout/page-header"
import { CopyButton } from "@/components/shared/copy-button"
import { DataList } from "@/components/shared/data-list"
import { SectionCard } from "@/components/shared/section-card"
import { Stagger } from "@/components/shared/stagger"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { DownloadButton } from "@/components/shared/download-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  formatDay,
  formatHours,
  PLAN_FORMATS,
  PLAN_HOURS,
  planOutputSchema,
  planStoredInputSchema,
  planToMarkdown,
  weekDates,
} from "@/lib/ai/prompts/plan"
import { requireUser } from "@/lib/auth/dal"
import { creditsLabel } from "@/lib/credits/costs"
import { PLAN_FORMAT_TONE } from "@/lib/status-colors"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Plano da semana · CCD Studio" }

const HEADER = { eyebrow: "Calendário editorial", icon: "calendar" as const, help: "calendario-resultado" as const }
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" })

async function Result({ params }: { params: PageProps<"/calendario/[id]">["params"] }) {
  const user = await requireUser()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const supabase = await createClient()
  const { data: generation } = await supabase
    .from("ai_generations")
    .select("id, created_at, input, output, credits_charged")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("feature", "plan")
    .maybeSingle()
  if (!generation) notFound()

  const output = planOutputSchema.safeParse(generation.output)
  const input = planStoredInputSchema.safeParse(generation.input)
  if (!output.success || !input.success) notFound()
  const o = output.data
  const start = input.data.inicio
  const days = weekDates(start)
  const range = `${formatDay(days[0].date)} a ${formatDay(days[6].date)}`
  const markdown = planToMarkdown(o, start)
  const hoursLabel = PLAN_HOURS.find((h) => h.value === input.data.horas)?.label ?? `${input.data.horas} horas`

  return (
    <>
      <PageHeader
        {...HEADER}
        title={`Semana de ${range}`}
        description={`Vídeo principal: ${o.titulo_principal} · gerado em ${dateFmt.format(new Date(generation.created_at))}`}
        back={{ href: "/calendario" }}
        actions={
          <>
            <NewGenerationLink href="/calendario/novo" label="Novo plano" icon="calendar" />
            <CopyButton text={markdown} what="Plano" label="Copiar plano" size="default" />
            <DownloadButton text={markdown} filename={`plano-semana-${start}.md`} label="Baixar plano" what="Plano" />
          </>
        }
      />

      <Stagger className="flex flex-col gap-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Horas da semana", value: formatHours(o.horas_total), hint: `você tem: ${hoursLabel.toLowerCase()}` },
            { label: "Publicações", value: "3 dias", hint: "1 principal, 1 simples e 3 Shorts" },
            { label: "Dia do principal", value: o.itens.find((i) => i.formato === "principal")?.dia ?? "—", hint: input.data.melhor_dia ? "o melhor dia do seu canal" : "escolhido pela IA: ainda sem dados do canal" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-1 rounded-xl border border-border bg-card p-5">
              <span className="label">{s.label}</span>
              <span className="font-heading text-3xl font-extrabold tracking-[-0.03em] capitalize tabular-nums">{s.value}</span>
              <span className="truncate text-xs text-muted-foreground">{s.hint}</span>
            </div>
          ))}
        </div>

        <SectionCard
          title="A semana"
          description="Os dias em branco são folga de propósito: é o que deixa o plano sobreviver a uma semana corrida."
        >
          <PlanWeek output={o} start={start} />
        </SectionCard>

        <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="label px-4">Dia</TableHead>
                <TableHead className="label">Formato</TableHead>
                <TableHead className="label">Título de trabalho</TableHead>
                <TableHead className="label">Promessa</TableHead>
                <TableHead className="label">O que já existe</TableHead>
                <TableHead className="label text-right">Horas</TableHead>
                <TableHead className="label px-4 text-right">Criar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems(o).map((i, n) => {
                const date = days.find((d) => d.day === i.dia)?.date
                return (
                  <TableRow key={`${i.dia}-${i.formato}-${n}`}>
                    <TableCell className="px-4 whitespace-nowrap capitalize">
                      {i.dia} <span className="text-muted-foreground tabular-nums">{date ? formatDay(date) : ""}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(PLAN_FORMAT_TONE[i.formato])}>
                        {PLAN_FORMATS[i.formato]}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-56 font-semibold whitespace-normal">{i.titulo}</TableCell>
                    <TableCell className="min-w-56 whitespace-normal text-muted-foreground">{i.promessa}</TableCell>
                    <TableCell className="min-w-40 whitespace-normal text-muted-foreground">{i.ja_existe}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatHours(i.horas)}</TableCell>
                    <TableCell className="px-4 text-right">
                      {/* Shorts saem cortados do vídeo principal; os vídeos ganham o pacote completo com um clique. */}
                      {i.formato === "short" ? (
                        <span className="text-xs text-muted-foreground">corte do principal</span>
                      ) : (
                        <Link
                          href={`/criar/video/novo?${new URLSearchParams({ assunto: `${i.titulo}. ${i.promessa}` })}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Vídeo completo
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <SectionCard title="Antes de começar" description="Nada é publicado automaticamente. Publica assim ou muda alguma coisa?">
          <DataList
            items={[
              { label: "Por que esse dia", value: o.por_que_o_dia, wide: true },
              { label: "Se a semana apertar, corte primeiro", value: o.cortar_primeiro, wide: true },
              ...(o.assunto_sugerido_por ? [{ label: "De onde veio o assunto", value: o.assunto_sugerido_por, wide: true }] : []),
            ]}
          />
        </SectionCard>

        <p className="text-xs text-muted-foreground">
          Gerado por IA com {creditsLabel(generation.credits_charged)} a partir dos dados públicos do seu canal. Confira antes de
          seguir.
        </p>
      </Stagger>
    </>
  )
}

export default function PlanResultPage({ params }: PageProps<"/calendario/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} title="Plano da semana" description="Carregando…" />
          <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Result params={params} />
    </Suspense>
  )
}
