"use server"

import { revalidatePath } from "next/cache"
import type { WizardResult } from "@/components/ai/step-wizard"
import {
  buildPlanPrompt,
  isCompletePlan,
  PLAN_DAYS,
  PLAN_PROMPT_VERSION,
  planInputSchema,
  planOutputSchema,
  weekStart,
  type PlanDay,
} from "@/lib/ai/prompts/plan"
import { AiError, runAiFeature } from "@/lib/ai/run-feature"
import { getVoiceProfile, voicePromptBlock } from "@/lib/ai/voice"
import { requireUser } from "@/lib/auth/dal"
import { outlierContext } from "@/lib/youtube/channel-context"
import { getMyChannelData } from "@/lib/youtube/channel-data"
import { insightsForPrompt, weekdayStats } from "@/lib/youtube/channel-insights"

/** Gera o plano da semana (skill yt-plan). Sucesso devolve o id; o formulário leva ao resultado. */
export async function generatePlan(values: Record<string, string>): Promise<WizardResult> {
  const user = await requireUser()

  const parsed = planInputSchema.safeParse({
    horas: values.horas,
    assunto: values.assunto ?? "",
    pronto: values.pronto ?? "",
    semana: values.semana,
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const [data, voice] = await Promise.all([getMyChannelData(user.youtube_channel_id), getVoiceProfile(user.id)])

  // O melhor dia vem dos dados do canal (o mesmo do Relatório), não de uma pergunta.
  const best = data ? weekdayStats(data.videos).best : null
  const bestDay = best && (PLAN_DAYS as readonly string[]).includes(best.day) ? (best.day as PlanDay) : null
  const channel = data
    ? [outlierContext(data.channel.title, data.videos), "RESUMO DO CANAL", insightsForPrompt(data.videos)].join("\n")
    : "DADOS DO CANAL: nenhum canal vinculado."

  const { system, userMessage } = buildPlanPrompt(parsed.data, channel, bestDay, voicePromptBlock(voice))
  // A segunda-feira da semana é calculada aqui (horário de Brasília) e fica salva com o pedido.
  const input = { ...parsed.data, inicio: weekStart(parsed.data.semana), melhor_dia: bestDay }

  let id: string
  try {
    ;({ id } = await runAiFeature({
      feature: "plan",
      promptVersion: PLAN_PROMPT_VERSION,
      userId: user.id,
      input,
      system,
      userMessage,
      schema: planOutputSchema,
      validate: (o) => isCompletePlan(o, parsed.data, bestDay),
      maxOutputTokens: 4000,
    }))
  } catch (error) {
    if (error instanceof AiError) return { message: error.message }
    return { message: "Não foi possível montar o plano agora. Tente novamente; nenhum crédito foi cobrado." }
  }

  revalidatePath("/", "layout")
  return { id }
}
