import type { Database } from "@/lib/supabase/database.types"

// Extrato de créditos (/conta/planos): rótulos em linguagem simples para cada lançamento do credit_ledger.

export type LedgerRow = Database["public"]["Tables"]["credit_ledger"]["Row"]
export type LedgerReason = LedgerRow["reason"]
export type LedgerBucket = LedgerRow["bucket"]

export const LEDGER_REASON: Record<LedgerReason, string> = {
  monthly_reset: "Renovação mensal",
  usage: "Uso",
  adjustment: "Ajuste",
  purchase: "Compra",
  refund: "Reembolso",
  migration: "Migração",
}

export const LEDGER_BUCKET: Record<LedgerBucket, string> = {
  free: "Gratuito",
  purchased: "Comprado",
}

const monthFmt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })

/** "2026-11" → "novembro de 2026". */
export function periodLabel(period: string | null) {
  if (!period) return null
  const [y, m] = period.split("-").map(Number)
  return monthFmt.format(new Date(Date.UTC(y, m - 1, 15)))
}

/** +5 / −1 (sinal de menos tipográfico). */
export function signedCredits(amount: number) {
  return amount > 0 ? `+${amount}` : amount < 0 ? `−${Math.abs(amount)}` : "0"
}
