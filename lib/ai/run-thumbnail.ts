import "server-only"
import { randomUUID } from "node:crypto"
import { FEATURE_COSTS } from "@/lib/credits/costs"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  buildThumbnailPrompt,
  isCompleteConcept,
  THUMBNAIL_PROMPT_VERSION,
  thumbnailConceptSchema,
  type ThumbnailInput,
  type ThumbnailOutput,
} from "./prompts/thumbnail"
import { generateImage, toYoutubeThumbnail } from "./image"
import { AiError } from "./errors"
import { assertCanGenerate, recordGeneration } from "./run-feature"
import { aiJson } from "./service"

/** Bucket privado do Supabase Storage com as capas (supabase/migrations/0008_thumbnails_storage.sql). */
export const THUMBNAILS_BUCKET = "thumbnails"

/**
 * Thumbnail cobrada (2 créditos): saldo → ideia + prompt (modelo de texto) → imagem (modelo de imagem)
 * → 1280×720 JPEG → Storage → débito + histórico. Qualquer falha antes do fim não cobra nada;
 * se a cobrança falhar, a imagem enviada é apagada. A foto do criador não é guardada.
 */
export async function runThumbnail(opts: { userId: string; input: ThumbnailInput; niche: string; voice: string }) {
  const cost = FEATURE_COSTS.thumbnail
  await assertCanGenerate(opts.userId, cost)

  const { system, userMessage } = buildThumbnailPrompt(opts.input, opts.niche, opts.voice)
  const { data: concept, usage: textUsage } = await aiJson({
    label: "thumbnail",
    system,
    input: userMessage,
    schema: thumbnailConceptSchema,
    validate: (c) => isCompleteConcept(c, opts.input.titulo, opts.input.texto_capa),
    maxOutputTokens: 3000,
    retries: 1,
  })

  const { png, usage: imageUsage } = await generateImage({
    label: "thumbnail-image",
    prompt: concept.prompt_imagem,
    reference: opts.input.foto || undefined,
  })
  const jpeg = await toYoutubeThumbnail(png)

  const path = `${opts.userId}/${randomUUID()}.jpg`
  const storage = createAdminClient().storage.from(THUMBNAILS_BUCKET)
  const { error: uploadError } = await storage.upload(path, jpeg, { contentType: "image/jpeg", upsert: false })
  if (uploadError) {
    console.error("[ai] thumbnail: falha ao salvar a imagem", uploadError.message)
    throw new AiError("unavailable")
  }

  const output: ThumbnailOutput = { ...concept, imagem_path: path, modelo_imagem: imageUsage.model, usou_foto: Boolean(opts.input.foto) }
  // A foto (data URL) nunca vai para o histórico.
  const { foto, ...rest } = opts.input
  try {
    const id = await recordGeneration({
      userId: opts.userId,
      feature: "thumbnail",
      promptVersion: THUMBNAIL_PROMPT_VERSION,
      model: `${textUsage.model} + ${imageUsage.model}`,
      input: { ...rest, usou_foto: Boolean(foto) },
      output,
      tokensIn: textUsage.inputTokens + imageUsage.inputTokens,
      tokensOut: textUsage.outputTokens + imageUsage.outputTokens,
      cost,
    })
    return { id, output }
  } catch (error) {
    await storage.remove([path])
    throw error
  }
}

/** URLs assinadas (1 h) das capas. Chamar só com caminhos de gerações já lidas do próprio usuário. */
export async function signedThumbnailUrls(paths: string[]) {
  if (!paths.length) return new Map<string, string>()
  const { data } = await createAdminClient().storage.from(THUMBNAILS_BUCKET).createSignedUrls(paths, 60 * 60)
  return new Map((data ?? []).flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [])))
}

/** URL assinada (1 h) que baixa o arquivo com o nome dado, em vez de abrir no navegador. */
export async function signedThumbnailDownload(path: string, filename: string) {
  const { data } = await createAdminClient().storage.from(THUMBNAILS_BUCKET).createSignedUrl(path, 60 * 60, { download: filename })
  return data?.signedUrl ?? null
}
