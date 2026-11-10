import "server-only"
import type { AiFeature } from "@/lib/credits/costs"
import { createClient } from "@/lib/supabase/server"

/** Gerações de uma feature do usuário logado (RLS: só as próprias), da mais recente para a mais antiga. */
export async function listGenerations(userId: string, feature: AiFeature, limit = 10) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("ai_generations")
    .select("id, created_at, input, output, credits_charged")
    .eq("user_id", userId)
    .eq("feature", feature)
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getLatestGeneration(userId: string, feature: AiFeature) {
  return (await listGenerations(userId, feature, 1))[0] ?? null
}
