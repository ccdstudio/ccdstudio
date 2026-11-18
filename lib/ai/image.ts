import "server-only"
import { toFile } from "openai"
import sharp from "sharp"
import { env } from "@/lib/env"
import { getOpenAI, isAiConfigured } from "./client"
import { AiError, toAiError } from "./errors"

// Gerador de imagens (OpenAI Images API, modelo OPENAI_IMAGE_MODEL). Sem cobrança: use runThumbnail.
// Os logs nunca incluem o prompt nem a imagem, só rótulo, modelo, tokens e tempo.

export type ImageUsage = { model: string; inputTokens: number; outputTokens: number; ms: number }

/** Data URL (data:image/jpeg;base64,...) → bytes + tipo. */
function fromDataUrl(dataUrl: string) {
  const [meta, b64] = dataUrl.split(",", 2)
  const type = meta.match(/^data:(image\/[a-z]+);base64$/)?.[1] ?? "image/jpeg"
  return { buffer: Buffer.from(b64 ?? "", "base64"), type }
}

/**
 * Gera uma imagem paisagem (1536×1024). Com `reference` (foto do criador), usa a edição com a foto como
 * referência; sem, gera do zero. Recusa por moderação vira AiError("image_refused").
 */
export async function generateImage(opts: { label: string; prompt: string; reference?: string }) {
  if (!isAiConfigured()) throw new AiError("not_configured")
  const model = env.OPENAI_IMAGE_MODEL
  const started = Date.now()
  try {
    // JPEG direto da OpenAI: arquivo bem menor que PNG para baixar; o sharp só redimensiona.
    const common = {
      model,
      prompt: opts.prompt,
      size: "1536x1024" as const,
      quality: "medium" as const,
      output_format: "jpeg" as const,
      output_compression: 92,
      n: 1,
    }
    const response = opts.reference
      ? await (async () => {
          const { buffer, type } = fromDataUrl(opts.reference!)
          const image = await toFile(buffer, `referencia.${type.split("/")[1]}`, { type })
          return getOpenAI().images.edit({ ...common, image })
        })()
      : await getOpenAI().images.generate(common)

    const b64 = response.data?.[0]?.b64_json
    const ms = Date.now() - started
    const usage: ImageUsage = {
      model,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      ms,
    }
    console.info(`[ai] label=${opts.label} model=${model} in=${usage.inputTokens} out=${usage.outputTokens} ms=${ms} ref=${Boolean(opts.reference)}`)
    if (!b64) throw new AiError("invalid_output")
    return { image: Buffer.from(b64, "base64"), usage }
  } catch (error) {
    console.error(`[ai] label=${opts.label} model=${model} ms=${Date.now() - started} falha=${error instanceof Error ? error.name : "erro"}`)
    throw toAiError(error)
  }
}

/** Corta para o formato do YouTube (16:9, 1280×720) pelo centro e salva em JPEG. */
export function toYoutubeThumbnail(image: Buffer) {
  return sharp(image).resize(1280, 720, { fit: "cover", position: "centre" }).jpeg({ quality: 88, mozjpeg: true }).toBuffer()
}
