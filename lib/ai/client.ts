import "server-only"
import OpenAI from "openai"
import { env } from "@/lib/env"

let client: OpenAI | null = null

export function isAiConfigured() {
  return Boolean(env.OPENAI_API_KEY)
}

export function getOpenAI() {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada")
  client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: 90_000, maxRetries: 1 })
  return client
}
