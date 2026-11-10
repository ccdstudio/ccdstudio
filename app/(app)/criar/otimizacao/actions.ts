"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/auth/dal"
import type { FormState } from "@/lib/auth/schemas"
import { buildMetadataPrompt, METADATA_PROMPT_VERSION, type ChannelContext } from "@/lib/ai/prompts/metadata"
import { AiError, runAiFeature } from "@/lib/ai/run-feature"
import { isCompleteMetadata, metadataInputSchema, metadataOutputSchema } from "@/lib/ai/schemas/metadata"
import { createClient } from "@/lib/supabase/server"

async function channelContext(channelId: string | null): Promise<ChannelContext> {
  if (!channelId) return null
  const supabase = await createClient()
  const { data } = await supabase.from("youtube_channels").select("title, description").eq("id", channelId).maybeSingle()
  return data ? { title: data.title, description: data.description } : null
}

export async function generateMetadata(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()

  const parsed = metadataInputSchema.safeParse({
    assunto: formData.get("assunto"),
    palavraChave: formData.get("palavraChave"),
    objetivo: formData.get("objetivo"),
    nicho: formData.get("nicho"),
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const { system, userMessage } = buildMetadataPrompt(parsed.data, await channelContext(user.youtube_channel_id))

  let id: string
  try {
    ;({ id } = await runAiFeature({
      feature: "metadata",
      promptVersion: METADATA_PROMPT_VERSION,
      userId: user.id,
      input: parsed.data,
      system,
      userMessage,
      schema: metadataOutputSchema,
      validate: isCompleteMetadata,
      maxOutputTokens: 8000,
    }))
  } catch (error) {
    if (error instanceof AiError) return { message: error.message }
    console.error("[ai] metadata: erro inesperado", error instanceof Error ? error.name : error)
    return { message: "Não foi possível gerar agora. Tente novamente; nenhum crédito foi cobrado." }
  }

  revalidatePath("/", "layout") // saldo da sidebar
  redirect(`/criar/otimizacao/${id}`)
}
