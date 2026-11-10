"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth/dal"
import type { FormState } from "@/lib/auth/schemas"
import { buildVoiceInput, VOICE_PROMPT_VERSION, VOICE_SYSTEM, voiceOutputSchema } from "@/lib/ai/prompts/voice"
import { AiError, runAiFeature } from "@/lib/ai/run-feature"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { engagement, uploadRhythm } from "@/lib/youtube/channel-insights"

const clean = (xs: string[], max: number) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))].slice(0, max)

function revalidateVoice() {
  revalidatePath("/analises/voz")
}

/** Gera o perfil de voz a partir do canal vinculado (0 créditos, fica no histórico). */
export async function generateVoiceProfile(): Promise<FormState> {
  const user = await requireUser()
  if (!user.youtube_channel_id) return { message: "Vincule o seu canal do YouTube primeiro (card Canal do YouTube)." }

  const supabase = await createClient()
  const [{ data: channel }, { data: videos }] = await Promise.all([
    supabase.from("youtube_channels").select("title, description, keywords").eq("id", user.youtube_channel_id).maybeSingle(),
    supabase
      .from("youtube_videos")
      .select("id, title, published_at, thumbnail_url, duration_seconds, is_short, view_count, like_count, comment_count")
      .eq("channel_id", user.youtube_channel_id)
      .order("published_at", { ascending: false }),
  ])
  if (!channel) return { message: "Os dados do canal ainda não foram carregados. Tente em instantes." }

  const list = videos ?? []
  const e = engagement(list)
  const r = uploadRhythm(list)
  const stats = `${list.length} vídeos recentes (${e.longs} longos, ${e.shorts} Shorts); um upload a cada ${r.medianGapDays?.toFixed(1) ?? "?"} dias em média.`

  try {
    const { output } = await runAiFeature({
      feature: "voice",
      promptVersion: VOICE_PROMPT_VERSION,
      userId: user.id,
      input: { canal: channel.title },
      system: VOICE_SYSTEM,
      userMessage: buildVoiceInput(channel, list.map((v) => v.title), stats),
      schema: voiceOutputSchema,
      maxOutputTokens: 4000,
    })

    const { error } = await createAdminClient().from("voice_profiles").upsert({
      user_id: user.id,
      niche: output.nicho.trim(),
      audience: output.publico.trim(),
      tone: output.tom.trim(),
      uses: clean(output.usa, 10),
      avoids: clean(output.evita, 10),
      wont_claim: clean(output.nao_afirma, 6),
      format: output.formato.trim(),
      source: "ai",
      updated_at: new Date().toISOString(),
    })
    if (error) return { message: "Não foi possível salvar o perfil de voz. Tente novamente." }
  } catch (error) {
    if (error instanceof AiError) return { message: error.message }
    return { message: "Não foi possível gerar o perfil agora. Tente novamente." }
  }

  revalidateVoice()
  return { ok: true, message: "Perfil de voz gerado. Revise e ajuste o que não for a sua cara." }
}

const lines = (v: FormDataEntryValue | null, max: number) => clean(String(v ?? "").split(/\r?\n|;/), max)
const text = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max)

/** Edição manual do perfil de voz (modal no Perfil). */
export async function saveVoiceProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const row = {
    user_id: user.id,
    niche: text(formData.get("niche"), 120),
    audience: text(formData.get("audience"), 400),
    tone: text(formData.get("tone"), 400),
    uses: lines(formData.get("uses"), 15),
    avoids: lines(formData.get("avoids"), 15),
    wont_claim: lines(formData.get("wont_claim"), 10),
    format: text(formData.get("format"), 400),
    source: "manual" as const,
    updated_at: new Date().toISOString(),
  }
  if (!row.niche) return { fieldErrors: { niche: ["Informe o nicho do canal"] } }

  const { error } = await createAdminClient().from("voice_profiles").upsert(row)
  if (error) return { message: "Não foi possível salvar. Tente novamente." }

  revalidateVoice()
  return { ok: true, message: "Perfil de voz salvo." }
}
