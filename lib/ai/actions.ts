"use server"

import { requireRole } from "@/lib/auth/dal"
import { AiError } from "./errors"
import { aiText } from "./service"

export type AiTestResult =
  | { ok: true; model: string; ms: number; inputTokens: number; outputTokens: number; reply: string }
  | { ok: false; message: string }

/** Teste de conexão com a OpenAI (só superadmin). Sem cobrança e sem histórico. */
export async function testAiConnection(): Promise<AiTestResult> {
  await requireRole("superadmin")
  try {
    const { text, usage } = await aiText({
      label: "healthcheck",
      system: "Você é um teste de conexão. Responda exatamente com a palavra: ok",
      input: "ok?",
      maxOutputTokens: 300,
      effort: "low",
      temperature: 0,
    })
    return { ok: true, reply: text.slice(0, 40), ...usage }
  } catch (error) {
    return { ok: false, message: error instanceof AiError ? error.message : "Falha inesperada ao chamar a IA." }
  }
}
