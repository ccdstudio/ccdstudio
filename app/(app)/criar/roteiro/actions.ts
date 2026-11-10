"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth/dal"
import type { WizardResult } from "@/components/ai/step-wizard"
import { buildScriptPrompt, isCompleteScript, SCRIPT_PROMPT_VERSION, scriptInputSchema, scriptOutputSchema } from "@/lib/ai/prompts/script"
import { AiError, runAiFeature } from "@/lib/ai/run-feature"
import { getVoiceProfile, voicePromptBlock } from "@/lib/ai/voice"
import { outliers } from "@/lib/youtube/channel-insights"
import { getMyChannelData } from "@/lib/youtube/channel-data"

/** Fórmulas dos estouros do canal, para o prompt priorizar o que já funcionou ali. */
async function channelContext(channelId: string | null) {
  const data = await getMyChannelData(channelId)
  if (!data) return ""
  const o = outliers(data.videos)
  const hits = [...o.longos.top, ...o.shorts.top].filter((v) => v.multiple >= 1.5 && v.formula.id !== "none")
  const formulas = [...new Set(hits.map((v) => v.formula.nome))].slice(0, 4)
  return [
    `DADOS DO CANAL (${data.channel.title})`,
    formulas.length ? `Fórmulas dos vídeos que mais superaram a mediana do canal: ${formulas.join(", ")}.` : "",
    hits.length ? `Exemplos de títulos que estouraram: ${hits.slice(0, 3).map((h) => `"${h.title}"`).join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

/** Chamada pelo formulário em etapas (StepWizard). Sucesso devolve o id; o cliente leva ao resultado. */
export async function generateScript(values: Record<string, string>): Promise<WizardResult> {
  const user = await requireUser()

  const parsed = scriptInputSchema.safeParse({
    tema: values.tema,
    publico: values.publico,
    objetivo: values.objetivo,
    duracao: values.duracao,
    nicho: values.nicho,
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const [context, voice] = await Promise.all([channelContext(user.youtube_channel_id), getVoiceProfile(user.id)])
  const { system, userMessage } = buildScriptPrompt(parsed.data, context, voicePromptBlock(voice))

  let id: string
  try {
    ;({ id } = await runAiFeature({
      feature: "script",
      promptVersion: SCRIPT_PROMPT_VERSION,
      userId: user.id,
      input: parsed.data,
      system,
      userMessage,
      schema: scriptOutputSchema,
      validate: (o) => isCompleteScript(o, parsed.data.duracao),
      // Roteiro longo + raciocínio: limite alto.
      maxOutputTokens: 6000 + parsed.data.duracao * 600,
    }))
  } catch (error) {
    if (error instanceof AiError) return { message: error.message }
    return { message: "Não foi possível gerar o roteiro agora. Tente novamente; nenhum crédito foi cobrado." }
  }

  revalidatePath("/", "layout")
  return { id }
}
