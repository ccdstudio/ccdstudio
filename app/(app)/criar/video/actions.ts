"use server"

import { revalidatePath } from "next/cache"
import type { WizardResult } from "@/components/ai/step-wizard"
import { VIDEO_PARTS, videoInputSchema, videoOutputSchema, videoStoredInputSchema, type VideoPartKey } from "@/lib/ai/prompts/video"
import { AiError } from "@/lib/ai/run-feature"
import { retryVideoPackagePart, runVideoPackage } from "@/lib/ai/run-video-package"
import { requireUser } from "@/lib/auth/dal"
import { createClient } from "@/lib/supabase/server"

/** Gera o pacote completo (otimização + roteiro + thumbnail). Sucesso devolve o id; o formulário leva ao resultado. */
export async function generateVideoPackage(values: Record<string, string>): Promise<WizardResult> {
  const user = await requireUser()

  const parsed = videoInputSchema.safeParse({
    pedido: values.pedido,
    duracao: values.duracao,
    nicho: values.nicho,
    foto: values.foto ?? "",
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  let id: string
  try {
    ;({ id } = await runVideoPackage({ userId: user.id, channelId: user.youtube_channel_id, input: parsed.data }))
  } catch (error) {
    if (error instanceof AiError) return { message: error.message }
    console.error("[ai] video: erro inesperado", error instanceof Error ? error.name : "erro")
    return { message: "Não foi possível gerar o vídeo completo agora. Tente novamente; nenhum crédito foi cobrado." }
  }

  revalidatePath("/", "layout")
  return { id }
}

export type RetryState = { ok?: boolean; message?: string }

/** Gera de novo só a parte que falhou num pacote. */
export async function retryVideoPart(packageId: string, part: string): Promise<RetryState> {
  const user = await requireUser()
  if (!/^[0-9a-f-]{36}$/i.test(packageId) || !(VIDEO_PARTS as readonly string[]).includes(part)) {
    return { message: "Pedido inválido." }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("ai_generations")
    .select("input, output")
    .eq("id", packageId)
    .eq("user_id", user.id)
    .eq("feature", "video")
    .maybeSingle()
  const output = videoOutputSchema.safeParse(data?.output)
  const input = videoStoredInputSchema.safeParse(data?.input)
  if (!output.success || !input.success) return { message: "Vídeo completo não encontrado." }
  const key = part as VideoPartKey
  if ("id" in output.data.partes[key]) return { ok: true }

  try {
    await retryVideoPackagePart({
      userId: user.id,
      channelId: user.youtube_channel_id,
      packageId,
      stored: { nicho: input.data.nicho, duracao: input.data.duracao },
      output: output.data,
      part: key,
    })
  } catch (error) {
    if (error instanceof AiError) return { message: error.message }
    return { message: "Não foi possível gerar agora. Tente novamente; nenhum crédito foi cobrado." }
  }

  revalidatePath("/", "layout")
  return { ok: true }
}
