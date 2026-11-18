import "server-only"
import type { z } from "zod"
import { getCreditBalance } from "@/lib/credits/balance"
import { FEATURE_COSTS, type AiFeature } from "@/lib/credits/costs"
import type { Json } from "@/lib/supabase/database.types"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAiConfigured } from "./client"
import { AiError } from "./errors"
import { aiJson } from "./service"

export { AiError, type AiErrorCode } from "./errors"

// Pipeline das ferramentas cobradas (docs/SISTEMA-NOVO.md §3 e §7):
// saldo → aiJson (saída estruturada + 1 nova tentativa) → débito + histórico (record_generation).
// Se a geração falhar, nada é cobrado. Para chamadas internas sem cobrança, use aiJson/aiText (lib/ai/service.ts).

type RunOptions<S extends z.ZodType> = {
  feature: AiFeature
  promptVersion: string
  userId: string
  /** Gravado no histórico (o que o usuário enviou). */
  input: Record<string, unknown>
  system: string
  userMessage: string
  schema: S
  validate?: (output: z.infer<S>) => boolean
  maxOutputTokens: number
  temperature?: number
  /** Imagens (URLs) enviadas ao modelo, ex.: miniaturas no diagnóstico. */
  images?: string[]
  /** Sobrescreve FEATURE_COSTS (ex.: diagnóstico com miniaturas). */
  cost?: number
}

export async function runAiFeature<S extends z.ZodType>(opts: RunOptions<S>): Promise<{ id: string; output: z.infer<S> }> {
  const cost = opts.cost ?? FEATURE_COSTS[opts.feature]
  await assertCanGenerate(opts.userId, cost)

  const { data: output, usage } = await aiJson({
    label: opts.feature,
    system: opts.system,
    input: opts.userMessage,
    schema: opts.schema,
    validate: opts.validate,
    maxOutputTokens: opts.maxOutputTokens,
    temperature: opts.temperature,
    images: opts.images,
    retries: 1,
  })

  const id = await recordGeneration({
    userId: opts.userId,
    feature: opts.feature,
    promptVersion: opts.promptVersion,
    model: usage.model,
    input: opts.input,
    output,
    tokensIn: usage.inputTokens,
    tokensOut: usage.outputTokens,
    cost,
  })
  return { id, output }
}

/** Saldo suficiente para a ferramenta? Lança AiError se não der para gerar. */
export async function assertCanGenerate(userId: string, cost: number) {
  if (!isAiConfigured()) throw new AiError("not_configured")
  const balance = await getCreditBalance(userId)
  if (balance.total < cost) throw new AiError("insufficient_credits")
}

/** Débito + histórico numa transação (RPC record_generation). Só chamar depois que a geração deu certo. */
export async function recordGeneration(r: {
  userId: string
  feature: AiFeature
  promptVersion: string
  model: string
  input: Record<string, unknown>
  output: unknown
  tokensIn: number
  tokensOut: number
  cost: number
}): Promise<string> {
  const { data: id, error } = await createAdminClient().rpc("record_generation", {
    p_user: r.userId,
    p_feature: r.feature,
    p_prompt_version: r.promptVersion,
    p_model: r.model,
    p_input: r.input as Json,
    p_output: r.output as Json,
    p_tokens_in: r.tokensIn,
    p_tokens_out: r.tokensOut,
    p_cost: r.cost,
  })
  if (error || !id) {
    if (error?.message.includes("insufficient_credits")) throw new AiError("insufficient_credits")
    console.error(`[ai] ${r.feature}: falha ao registrar`, error?.code)
    throw new AiError("unavailable")
  }
  return id
}
