"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth/dal"
import type { FormState } from "@/lib/auth/schemas"
import { buildIdeasInput, IDEAS_PROMPT_VERSION, IDEAS_SYSTEM, ideasOutputSchema, isCompleteIdeas } from "@/lib/ai/prompts/ideas"
import { AiError, runAiFeature } from "@/lib/ai/run-feature"
import { getVoiceProfile, voicePromptBlock } from "@/lib/ai/voice"
import { insightsForPrompt, outliers } from "@/lib/youtube/channel-insights"
import { getMyChannelData } from "@/lib/youtube/channel-data"

/** Próximas 3 ideias a partir dos estouros do canal (1 crédito). */
export async function generateIdeas(): Promise<FormState> {
  const user = await requireUser()
  const data = await getMyChannelData(user.youtube_channel_id)
  if (!data) return { message: "Vincule o seu canal primeiro." }

  const o = outliers(data.videos)
  if (!o.longos.enough && !o.shorts.enough) {
    return { message: "Ainda não há vídeos suficientes para comparar (mínimo de 4 por formato)." }
  }

  try {
    const voice = await getVoiceProfile(user.id)
    await runAiFeature({
      feature: "ideas",
      promptVersion: IDEAS_PROMPT_VERSION,
      userId: user.id,
      input: { canal: data.channel.title, videos: data.videos.length },
      system: IDEAS_SYSTEM,
      userMessage: buildIdeasInput(data.channel.title, insightsForPrompt(data.videos), voicePromptBlock(voice)),
      schema: ideasOutputSchema,
      validate: isCompleteIdeas,
      maxOutputTokens: 5000,
    })
  } catch (error) {
    if (error instanceof AiError) return { message: error.message }
    return { message: "Não foi possível gerar as ideias agora. Tente novamente; nenhum crédito foi cobrado." }
  }

  revalidatePath("/analises/estouros")
  revalidatePath("/", "layout")
  return { ok: true, message: "Ideias geradas." }
}
