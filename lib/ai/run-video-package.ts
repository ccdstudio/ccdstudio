import "server-only"
import type { Json } from "@/lib/supabase/database.types"
import { VIDEO_PACKAGE_COST } from "@/lib/credits/costs"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { outlierContext } from "@/lib/youtube/channel-context"
import { getMyChannelData } from "@/lib/youtube/channel-data"
import { buildMetadataPrompt, METADATA_PROMPT_VERSION } from "./prompts/metadata"
import { buildScriptPrompt, isCompleteScript, SCRIPT_PROMPT_VERSION, scriptOutputSchema } from "./prompts/script"
import {
  buildVideoBriefingPrompt,
  isCompleteBriefing,
  VIDEO_PROMPT_VERSION,
  videoBriefingSchema,
  type VideoBriefing,
  type VideoInput,
  type VideoOutput,
  type VideoPart,
  type VideoPartKey,
} from "./prompts/video"
import { isCompleteMetadata, metadataOutputSchema } from "./schemas/metadata"
import { AiError, assertCanGenerate, recordGeneration, runAiFeature } from "./run-feature"
import { runThumbnail } from "./run-thumbnail"
import { aiJson } from "./service"
import { getVoiceProfile, voicePromptBlock } from "./voice"

type Ctx = {
  userId: string
  channelId: string | null
  nicho: string
  duracao: number
  briefing: Omit<VideoBriefing, "titulo">
  voice: string
}

const failure = (error: unknown, what: string): VideoPart => {
  if (error instanceof AiError) return { erro: error.message }
  console.error(`[ai] video: ${what} falhou`, error instanceof Error ? error.name : "erro")
  return { erro: `Não foi possível gerar ${what} agora. Nenhum crédito foi cobrado por esta parte.` }
}

async function metadataContext(channelId: string | null) {
  if (!channelId) return null
  const supabase = await createClient()
  const { data } = await supabase.from("youtube_channels").select("title, description").eq("id", channelId).maybeSingle()
  return data ? { title: data.title, description: data.description } : null
}

async function scriptContext(channelId: string | null) {
  const data = await getMyChannelData(channelId)
  return data ? outlierContext(data.channel.title, data.videos) : ""
}

async function runMetadata(ctx: Ctx, title: string) {
  const input = { assunto: ctx.briefing.tema, palavraChave: ctx.briefing.palavra_chave, objetivo: ctx.briefing.objetivo, nicho: ctx.nicho }
  const { system, userMessage } = buildMetadataPrompt(input, await metadataContext(ctx.channelId), ctx.voice, title)
  return runAiFeature({
    feature: "metadata",
    promptVersion: METADATA_PROMPT_VERSION,
    userId: ctx.userId,
    input,
    system,
    userMessage,
    schema: metadataOutputSchema,
    validate: isCompleteMetadata,
    maxOutputTokens: 8000,
  })
}

async function runScript(ctx: Ctx, title: string) {
  const input = { tema: ctx.briefing.tema, publico: ctx.briefing.publico, objetivo: ctx.briefing.objetivo, duracao: ctx.duracao, nicho: ctx.nicho }
  // O roteiro abre confirmando a promessa do título: título e gancho são uma peça só.
  const context = [
    await scriptContext(ctx.channelId),
    `TÍTULO JÁ ESCOLHIDO PARA ESTE VÍDEO: "${title}"\nUse esse título como titulo_sugerido. Os ganchos confirmam a promessa dele logo na primeira frase.`,
  ]
    .filter(Boolean)
    .join("\n\n")
  const { system, userMessage } = buildScriptPrompt(input, context, ctx.voice)
  return runAiFeature({
    feature: "script",
    promptVersion: SCRIPT_PROMPT_VERSION,
    userId: ctx.userId,
    input,
    system,
    userMessage,
    schema: scriptOutputSchema,
    validate: (o) => isCompleteScript(o, ctx.duracao),
    maxOutputTokens: 6000 + ctx.duracao * 600,
  })
}

function runCover(ctx: Ctx, title: string, text: string, foto: string) {
  return runThumbnail({
    userId: ctx.userId,
    input: { titulo: title.slice(0, 100), assunto: ctx.briefing.tema, texto_capa: text, estilo: ctx.briefing.estilo_capa, foto },
    niche: ctx.nicho,
    voice: ctx.voice,
  })
}

/**
 * Vídeo completo: briefing (grátis, já com o título final) → otimização, roteiro e capa em paralelo → registro
 * do pacote. O tempo total é o do briefing + a parte mais lenta (o roteiro).
 * Cada parte cobra e grava a própria geração; a que falhar não cobra e fica com a mensagem de erro.
 * Se nada der certo, lança o erro e nada é gravado.
 */
export async function runVideoPackage(opts: { userId: string; channelId: string | null; input: VideoInput }) {
  const { input } = opts
  await assertCanGenerate(opts.userId, VIDEO_PACKAGE_COST)
  const voice = voicePromptBlock(await getVoiceProfile(opts.userId))

  const { system, userMessage } = buildVideoBriefingPrompt(input, Boolean(input.foto), voice)
  const { data: briefing } = await aiJson({
    label: "video-briefing",
    system,
    input: userMessage,
    schema: videoBriefingSchema,
    validate: isCompleteBriefing,
    maxOutputTokens: 3000,
    // Organizar o pedido é tarefa curta: sem raciocínio longo antes de tudo começar.
    effort: "minimal",
    retries: 1,
  })
  const ctx: Ctx = { userId: opts.userId, channelId: opts.channelId, nicho: input.nicho, duracao: input.duracao, briefing, voice }

  const title = briefing.titulo
  const [metadata, script, thumbnail] = await Promise.allSettled([
    runMetadata(ctx, title),
    runScript(ctx, title),
    // Texto da capa em branco: a ideia da capa sugere um que completa o título.
    runCover(ctx, title, "", input.foto),
  ])
  const partes = {
    metadata: metadata.status === "fulfilled" ? { id: metadata.value.id } : failure(metadata.reason, "a otimização"),
    script: script.status === "fulfilled" ? { id: script.value.id } : failure(script.reason, "o roteiro"),
    thumbnail: thumbnail.status === "fulfilled" ? { id: thumbnail.value.id } : failure(thumbnail.reason, "a capa"),
  }
  if (Object.values(partes).every((p) => "erro" in p)) {
    const reason = script.status === "rejected" ? script.reason : null
    throw reason instanceof AiError ? reason : new AiError("unavailable")
  }

  const output: VideoOutput = {
    briefing,
    titulo: title,
    texto_capa: "",
    capa_path: thumbnail.status === "fulfilled" ? thumbnail.value.output.imagem_path : undefined,
    partes,
  }
  const { foto, ...rest } = input
  const id = await recordGeneration({
    userId: opts.userId,
    feature: "video",
    promptVersion: VIDEO_PROMPT_VERSION,
    model: "pacote",
    input: { ...rest, usou_foto: Boolean(foto) },
    output,
    tokensIn: 0,
    tokensOut: 0,
    cost: 0,
  })
  return { id, output }
}

/**
 * Gera de novo só a parte que falhou, com o briefing guardado no pacote, e atualiza o pacote.
 * A capa sai sem foto (a foto não é guardada). Chamar só com um pacote já lido do próprio usuário.
 */
export async function retryVideoPackagePart(opts: {
  userId: string
  channelId: string | null
  packageId: string
  stored: { nicho: string; duracao: number }
  output: VideoOutput
  part: VideoPartKey
}) {
  const voice = voicePromptBlock(await getVoiceProfile(opts.userId))
  const ctx: Ctx = {
    userId: opts.userId,
    channelId: opts.channelId,
    nicho: opts.stored.nicho,
    duracao: opts.stored.duracao,
    briefing: opts.output.briefing,
    voice,
  }
  const { titulo, texto_capa } = opts.output
  const result =
    opts.part === "metadata"
      ? await runMetadata(ctx, titulo)
      : opts.part === "script"
        ? await runScript(ctx, titulo)
        : await runCover(ctx, titulo, texto_capa, "")

  const output: VideoOutput = {
    ...opts.output,
    ...(opts.part === "thumbnail" && "imagem_path" in result.output ? { capa_path: result.output.imagem_path } : {}),
    partes: { ...opts.output.partes, [opts.part]: { id: result.id } },
  }
  const { error } = await createAdminClient()
    .from("ai_generations")
    // Gerações são só leitura nos tipos (histórico imutável); a exceção é o registro do pacote (custo 0),
    // que só troca o erro da parte pelo id da geração nova. As linhas cobradas nunca mudam.
    .update({ output: output as unknown as Json } as never)
    .eq("id", opts.packageId)
    .eq("user_id", opts.userId)
  if (error) console.error("[ai] video: falha ao atualizar o pacote", error.code)
  return result.id
}
