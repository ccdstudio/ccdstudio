"use server"

import { revalidatePath } from "next/cache"
import type { WizardResult } from "@/components/ai/step-wizard"
import { DEFAULT_NICHE } from "@/lib/ai/prompts/metadata"
import { thumbnailInputSchema } from "@/lib/ai/prompts/thumbnail"
import { AiError } from "@/lib/ai/run-feature"
import { runThumbnail } from "@/lib/ai/run-thumbnail"
import { getVoiceProfile, voicePromptBlock } from "@/lib/ai/voice"
import { requireUser } from "@/lib/auth/dal"

/** Gera a capa (ideia + prompt + imagem). Sucesso devolve o id; o formulário leva ao resultado. */
export async function generateThumbnail(values: Record<string, string>): Promise<WizardResult> {
  const user = await requireUser()

  const parsed = thumbnailInputSchema.safeParse({
    titulo: values.titulo,
    assunto: values.assunto,
    texto_capa: values.texto_capa ?? "",
    estilo: values.estilo,
    foto: values.foto ?? "",
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const voice = await getVoiceProfile(user.id)

  let id: string
  try {
    ;({ id } = await runThumbnail({
      userId: user.id,
      input: parsed.data,
      niche: voice?.niche || DEFAULT_NICHE,
      voice: voicePromptBlock(voice),
    }))
  } catch (error) {
    if (error instanceof AiError) return { message: error.message }
    console.error("[ai] thumbnail: erro inesperado", error instanceof Error ? error.name : "erro")
    return { message: "Não foi possível gerar a capa agora. Tente novamente; nenhum crédito foi cobrado." }
  }

  revalidatePath("/", "layout")
  return { id }
}
