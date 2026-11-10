import "server-only"
import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

export type CreditBalance = {
  free: number
  purchased: number
  total: number
  /** Dia 1 do mês seguinte (renovação dos créditos gratuitos). */
  nextResetAt: Date
}

export const LOW_CREDITS = 3

function nextReset(now = new Date()) {
  // Renovação às 03:00 de São Paulo do dia 1 (06:00 UTC); para exibição basta o dia.
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 6))
}

/** Saldo do usuário logado (RLS: só lê o próprio). */
export const getCreditBalance = cache(async (userId: string): Promise<CreditBalance> => {
  const supabase = await createClient()
  const { data } = await supabase.from("credit_balances").select("free, purchased").eq("user_id", userId).maybeSingle()
  const free = data?.free ?? 0
  const purchased = data?.purchased ?? 0
  return { free, purchased, total: free + purchased, nextResetAt: nextReset() }
})
