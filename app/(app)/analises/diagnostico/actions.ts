"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth/dal"
import type { FormState } from "@/lib/auth/schemas"
import { AUDIT_PROMPT_VERSION, AUDIT_SYSTEM, auditOutputSchema, buildAuditInput, isCompleteAudit } from "@/lib/ai/prompts/audit"
import { AiError, runAiFeature } from "@/lib/ai/run-feature"
import { getVoiceProfile, voicePromptBlock } from "@/lib/ai/voice"
import { AUDIT_THUMBNAILS_EXTRA, FEATURE_COSTS } from "@/lib/credits/costs"
import { insightsForPrompt, titleSet } from "@/lib/youtube/channel-insights"
import { getMyChannelData } from "@/lib/youtube/channel-data"

/** Diagnóstico do canal (1 crédito, ou 2 analisando as miniaturas por visão). */
export async function generateAudit(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const data = await getMyChannelData(user.youtube_channel_id)
  if (!data) return { message: "Vincule o seu canal primeiro." }
  if (data.videos.length < 3) return { message: "O canal precisa de pelo menos 3 vídeos para o diagnóstico." }

  const withThumbs = formData.get("miniaturas") === "on"
  const recent = titleSet(data.videos).items
  const thumbs = withThumbs
    ? recent.map((t) => data.videos.find((v) => v.id === t.id)?.thumbnail_url).filter((u): u is string => Boolean(u))
    : []

  try {
    const voice = await getVoiceProfile(user.id)
    await runAiFeature({
      feature: "audit",
      promptVersion: AUDIT_PROMPT_VERSION,
      userId: user.id,
      input: { canal: data.channel.title, miniaturas: withThumbs, videos: data.videos.length },
      system: AUDIT_SYSTEM,
      userMessage: buildAuditInput(
        data.channel.title,
        insightsForPrompt(data.videos),
        recent.map((t) => t.title),
        voicePromptBlock(voice),
        thumbs.length > 0
      ),
      schema: auditOutputSchema,
      validate: (o) => isCompleteAudit(o, thumbs.length > 0),
      images: thumbs,
      cost: FEATURE_COSTS.audit + (thumbs.length > 0 ? AUDIT_THUMBNAILS_EXTRA : 0),
      maxOutputTokens: 6000,
    })
  } catch (error) {
    if (error instanceof AiError) return { message: error.message }
    return { message: "Não foi possível gerar o diagnóstico agora. Tente novamente; nenhum crédito foi cobrado." }
  }

  revalidatePath("/analises/diagnostico")
  revalidatePath("/", "layout")
  return { ok: true, message: "Diagnóstico pronto." }
}
