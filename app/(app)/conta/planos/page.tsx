import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { InfoHint } from "@/components/shared/info-hint"
import { SectionCard } from "@/components/shared/section-card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HISTORY_TOOLS, toolInfo } from "@/lib/ai/history"
import { requireUser } from "@/lib/auth/dal"
import { getCreditBalance } from "@/lib/credits/balance"
import { creditsLabel, FEATURE_COSTS } from "@/lib/credits/costs"
import { LEDGER_BUCKET, LEDGER_REASON, periodLabel, signedCredits, type LedgerRow } from "@/lib/credits/ledger"
import { LEDGER_TONE } from "@/lib/status-colors"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { GLOSSARY } from "@/lib/youtube/glossary"

export const metadata: Metadata = { title: "Planos e créditos · CCD Studio" }

const HEADER = { eyebrow: "Conta", title: "Planos e créditos", icon: "billing" as const, help: "planos" as const }
const PAGE_SIZE = 20
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })
const dayFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" })

type Ledger = Pick<LedgerRow, "id" | "created_at" | "bucket" | "amount" | "reason" | "ref_id" | "period" | "note">

function Stat({ label, value, hint, text }: { label: string; value: React.ReactNode; hint?: string; text: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border p-4">
      <span className="label flex items-center gap-1">
        {label}
        <InfoHint text={text} label={label} />
      </span>
      <span className="font-heading text-3xl font-extrabold tracking-[-0.03em] tabular-nums">{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}

async function Credits({ searchParams }: { searchParams: PageProps<"/conta/planos">["searchParams"] }) {
  const user = await requireUser()
  const params = await searchParams
  const page = Math.max(1, Number(params.pagina) || 1)
  const from = (page - 1) * PAGE_SIZE
  const supabase = await createClient()

  const [balance, { data: profile }, { data: ledgerData, count }] = await Promise.all([
    getCreditBalance(user.id),
    supabase.from("profiles").select("plan_id").eq("id", user.id).single(),
    supabase
      .from("credit_ledger")
      .select("id, created_at, bucket, amount, reason, ref_id, period, note", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
  ])
  const { data: plan } = await supabase
    .from("plans")
    .select("name, monthly_free_credits")
    .eq("id", profile?.plan_id ?? "gratuito")
    .maybeSingle()

  const ledger = (ledgerData ?? []) as Ledger[]
  // Ferramenta de cada uso (uma consulta só para a página inteira).
  const usageIds = ledger.filter((l) => l.reason === "usage" && l.ref_id).map((l) => l.ref_id as string)
  const { data: gens } = usageIds.length
    ? await supabase.from("ai_generations").select("id, feature").in("id", usageIds)
    : { data: [] as { id: string; feature: string }[] }
  const featureOf = new Map((gens ?? []).map((g) => [g.id, g.feature]))

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const monthly = plan?.monthly_free_credits ?? 20

  function detail(l: Ledger) {
    if (l.reason === "usage") {
      const feature = l.ref_id ? featureOf.get(l.ref_id) : undefined
      const info = feature ? toolInfo(feature) : null
      if (!info || !l.ref_id) return <span className="text-muted-foreground">Geração com IA</span>
      return (
        <Link href={info.href(l.ref_id)} className="font-medium text-primary hover:underline">
          {info.label}
        </Link>
      )
    }
    if (l.reason === "monthly_reset") return `Créditos de ${periodLabel(l.period) ?? "mês"}`
    return l.note ?? "—"
  }

  const tools = Object.entries(HISTORY_TOOLS).map(([key, t]) => ({
    label: t.label,
    cost: FEATURE_COSTS[key as keyof typeof FEATURE_COSTS],
  }))

  return (
    <>
      <PageHeader {...HEADER} description="Seu saldo, quanto custa cada ferramenta e tudo o que entrou e saiu." />

      <SectionCard title="Seu saldo" description={`Plano ${plan?.name ?? "Gratuito"}: ${monthly} créditos gratuitos por mês.`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="Disponível agora"
            value={balance.total}
            hint="gratuitos + comprados"
            text="Quantos créditos você pode usar agora. Cada geração com IA mostra no botão quanto custa."
          />
          <Stat
            label="Gratuitos"
            value={balance.free}
            hint={`voltam a ${monthly} em ${dayFmt.format(balance.nextResetAt)}`}
            text={GLOSSARY.creditosGratuitos}
          />
          <Stat label="Comprados" value={balance.purchased} hint="não expiram" text={GLOSSARY.creditosComprados} />
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Quanto custa cada ferramenta" description="O custo é fixo por geração. Se der erro, nada é cobrado.">
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border text-sm">
            {tools.map((t) => (
              <li key={t.label} className="flex items-center justify-between gap-3 px-3 py-2">
                <span>{t.label}</span>
                <span className="font-semibold tabular-nums">{creditsLabel(t.cost)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 px-3 py-2 text-muted-foreground">
              <span>Thumbnail</span>
              <span className="tabular-nums">{creditsLabel(FEATURE_COSTS.thumbnail)} · em breve</span>
            </li>
          </ul>
        </SectionCard>

        <SectionCard title="Planos pagos" description="Mais créditos por mês e pacotes avulsos.">
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Em breve você poderá assinar um plano com mais créditos ou comprar pacotes avulsos. Por enquanto, se precisar de
            mais créditos, fale com a equipe do CCD Studio.
          </p>
        </SectionCard>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-1 border-b border-border px-4 py-3">
          <h2 className="font-heading font-bold">Extrato</h2>
          <InfoHint term="extrato" label="Extrato" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="label px-4">Data</TableHead>
              <TableHead className="label">Movimento</TableHead>
              <TableHead className="label">Detalhe</TableHead>
              <TableHead className="label">Tipo</TableHead>
              <TableHead className="label px-4 text-right">Créditos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.length > 0 ? (
              ledger.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="px-4 text-muted-foreground tabular-nums">{dateTime.format(new Date(l.created_at))}</TableCell>
                  <TableCell className="font-semibold">{LEDGER_REASON[l.reason]}</TableCell>
                  <TableCell className="max-w-80 truncate">{detail(l)}</TableCell>
                  <TableCell className="text-muted-foreground">{LEDGER_BUCKET[l.bucket]}</TableCell>
                  <TableCell className="px-4 text-right">
                    <Badge variant="outline" className={cn("tabular-nums", l.amount > 0 ? LEDGER_TONE.in : LEDGER_TONE.out)}>
                      {signedCredits(l.amount)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  Nenhum movimento ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground tabular-nums">
              Página {page} de {totalPages} · {total} movimentos
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link href={`/conta/planos?pagina=${page - 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Anterior
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link href={`/conta/planos?pagina=${page + 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Próxima
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}

export default function PlansPage({ searchParams }: PageProps<"/conta/planos">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} description="Carregando…" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Credits searchParams={searchParams} />
    </Suspense>
  )
}
