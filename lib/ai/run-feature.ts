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
}

export async function runAiFeature<S extends z.ZodType>(opts: RunOptions<S>): Promise<{ id: string; output: z.infer<S> }> {
  if (!isAiConfigured()) throw new AiError("not_configured")

  const cost = FEATURE_COSTS[opts.feature]
  const balance = await getCreditBalance(opts.userId)
  if (balance.total < cost) throw new AiError("insufficient_credits")

  const { data: output, usage } = await aiJson({
    label: opts.feature,
    system: opts.system,
    input: opts.userMessage,
    schema: opts.schema,
    validate: opts.validate,
    maxOutputTokens: opts.maxOutputTokens,
    temperature: opts.temperature,
    retries: 1,
  })

  const { data: id, error } = await createAdminClient().rpc("record_generation", {
    p_user: opts.userId,
    p_feature: opts.feature,
    p_prompt_version: opts.promptVersion,
    p_model: usage.model,
    p_input: opts.input as Json,
    p_output: output as Json,
    p_tokens_in: usage.inputTokens,
    p_tokens_out: usage.outputTokens,
    p_cost: cost,
  })
  if (error || !id) {
    if (error?.message.includes("insufficient_credits")) throw new AiError("insufficient_credits")
    console.error(`[ai] ${opts.feature}: falha ao registrar`, error?.code)
    throw new AiError("unavailable")
  }

  return { id, output }
}
