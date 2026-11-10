import "server-only"
import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"
import type { z } from "zod"
import { env } from "@/lib/env"
import { getOpenAI, isAiConfigured } from "./client"
import { AiError, toAiError } from "./errors"

// Serviço de chamadas à OpenAI (Responses API). Sem cobrança e sem histórico: para isso use runAiFeature.
// Só no servidor. Os logs nunca incluem prompt nem resposta, apenas rótulo, modelo, tokens e tempo.

export type AiEffort = "minimal" | "low" | "medium" | "high"

export type AiUsage = { model: string; inputTokens: number; outputTokens: number; ms: number }

type BaseOptions = {
  /** Identifica a chamada nos logs (ex.: "metadata", "healthcheck"). */
  label: string
  /** Instruções de sistema. */
  system?: string
  /** Mensagem do usuário. */
  input: string
  /** Sempre definido: inclui os tokens de raciocínio nos modelos que raciocinam. */
  maxOutputTokens: number
  model?: string
  /** Modelos de raciocínio (gpt-5, o*): esforço. Padrão "low". */
  effort?: AiEffort
  /** Demais modelos: temperatura. Padrão 0.7. */
  temperature?: number
}

export const isReasoningModel = (model: string) => /^(o\d|gpt-5)/.test(model)

function requestParams(opts: BaseOptions) {
  if (!isAiConfigured()) throw new AiError("not_configured")
  const model = opts.model ?? env.OPENAI_MODEL
  return {
    model,
    params: {
      model,
      instructions: opts.system,
      input: opts.input,
      max_output_tokens: opts.maxOutputTokens,
      store: false,
      ...(isReasoningModel(model)
        ? { reasoning: { effort: opts.effort ?? "low" } }
        : { temperature: opts.temperature ?? 0.7 }),
    },
  }
}

function log(label: string, model: string, usage: { input_tokens?: number; output_tokens?: number } | undefined, ms: number, status?: string) {
  console.info(
    `[ai] label=${label} model=${model} in=${usage?.input_tokens ?? 0} out=${usage?.output_tokens ?? 0} ms=${ms} status=${status ?? "?"}`
  )
}

function logFailure(label: string, model: string, error: unknown, ms: number) {
  const detail = error instanceof OpenAI.APIError ? `${error.status ?? ""} ${error.code ?? ""}`.trim() : error instanceof Error ? error.name : "erro"
  console.error(`[ai] label=${label} model=${model} ms=${ms} falha=${detail}`)
}

/** Texto livre. */
export async function aiText(opts: BaseOptions): Promise<{ text: string; usage: AiUsage }> {
  const { model, params } = requestParams(opts)
  const started = Date.now()
  try {
    const response = await getOpenAI().responses.create(params)
    const ms = Date.now() - started
    log(opts.label, model, response.usage, ms, response.status)
    const text = response.output_text?.trim() ?? ""
    if (!text) throw new AiError("invalid_output")
    return {
      text,
      usage: { model, inputTokens: response.usage?.input_tokens ?? 0, outputTokens: response.usage?.output_tokens ?? 0, ms },
    }
  } catch (error) {
    if (!(error instanceof AiError)) logFailure(opts.label, model, error, Date.now() - started)
    throw toAiError(error)
  }
}

type JsonOptions<S extends z.ZodType> = BaseOptions & {
  /** Schema da saída (vai para a OpenAI como saída estruturada). */
  schema: S
  /** Validação extra depois do schema (contagens etc.). Se falhar, tenta de novo. */
  validate?: (data: z.infer<S>) => boolean
  /** Novas tentativas se a saída vier inválida ou a chamada falhar. Padrão 1. */
  retries?: number
}

/** Saída estruturada e validada por Zod. Os tokens de todas as tentativas são somados em `usage`. */
export async function aiJson<S extends z.ZodType>(opts: JsonOptions<S>): Promise<{ data: z.infer<S>; usage: AiUsage }> {
  const { model, params } = requestParams(opts)
  const attempts = 1 + (opts.retries ?? 1)
  const usage: AiUsage = { model, inputTokens: 0, outputTokens: 0, ms: 0 }

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const started = Date.now()
    try {
      const response = await getOpenAI().responses.parse({
        ...params,
        text: { format: zodTextFormat(opts.schema, opts.label.replace(/[^a-zA-Z0-9_-]/g, "_")) },
      })
      const ms = Date.now() - started
      usage.inputTokens += response.usage?.input_tokens ?? 0
      usage.outputTokens += response.usage?.output_tokens ?? 0
      usage.ms += ms
      log(opts.label, model, response.usage, ms, response.status)

      const data = response.output_parsed as z.infer<S> | null
      if (data && (!opts.validate || opts.validate(data))) return { data, usage }
      console.warn(`[ai] label=${opts.label} saída inválida (tentativa ${attempt}/${attempts})`)
    } catch (error) {
      usage.ms += Date.now() - started
      logFailure(opts.label, model, error, Date.now() - started)
      // Falha de rede/servidor → unavailable; falha ao interpretar a saída (tamanho, recusa) → invalid_output.
      const mapped =
        error instanceof OpenAI.APIError || error instanceof AiError ? toAiError(error) : new AiError("invalid_output")
      // Configuração errada ou limite: não adianta tentar de novo.
      const retryable = mapped.code === "unavailable" || mapped.code === "invalid_output"
      if (!retryable || attempt === attempts) throw mapped
    }
  }
  throw new AiError("invalid_output")
}
