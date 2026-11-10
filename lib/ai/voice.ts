import "server-only"
import { cache } from "react"
import type { VoiceProfile } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

/** Perfil de voz do usuário logado (RLS: só o próprio). */
export const getVoiceProfile = cache(async (userId: string): Promise<VoiceProfile | null> => {
  const supabase = await createClient()
  const { data } = await supabase.from("voice_profiles").select("*").eq("user_id", userId).maybeSingle()
  return data
})

const list = (xs: string[]) => (xs.length ? xs.join("; ") : "")

/**
 * Bloco para os prompts. Vazio quando não há perfil (o prompt funciona sem ele).
 * Regra da skill: um texto na voz errada é pior que nenhum, porque o criador precisa ler em voz alta.
 */
export function voicePromptBlock(voice: VoiceProfile | null) {
  if (!voice) return ""
  const lines = [
    voice.niche && `Nicho: ${voice.niche}`,
    voice.audience && `Fala com: ${voice.audience}`,
    voice.tone && `Tom: ${voice.tone}`,
    voice.uses.length && `Termos e jeitos que são dele: ${list(voice.uses)}`,
    voice.avoids.length && `Nunca usar: ${list(voice.avoids)}`,
    voice.wont_claim.length && `Não afirmar nem prometer: ${list(voice.wont_claim)}`,
    voice.format && `Formato: ${voice.format}`,
  ].filter(Boolean)
  if (!lines.length) return ""
  return `PERFIL DE VOZ DO CRIADOR (escreva como ele fala; respeite o que ele não usa e não afirma)
${lines.join("\n")}`
}
