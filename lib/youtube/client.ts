import "server-only"
import { z } from "zod"
import { env } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ChannelLookup } from "./parse-channel-input"

// Cliente da YouTube Data API v3 (API key, só dados públicos).
// Regra do projeto: nunca usar search.list (100 unidades). Ver docs/YOUTUBE-DADOS-PUBLICOS.md.

const API = "https://www.googleapis.com/youtube/v3"

export function isYoutubeConfigured() {
  return Boolean(env.YOUTUBE_API_KEY)
}

export type YoutubeErrorCode = "not_configured" | "not_found" | "quota" | "key" | "unavailable"

export class YoutubeError extends Error {
  constructor(
    public code: YoutubeErrorCode,
    message: string
  ) {
    super(message)
    this.name = "YoutubeError"
  }
}

const MESSAGES: Record<YoutubeErrorCode, string> = {
  not_configured: "A integração com o YouTube ainda não foi configurada.",
  not_found: "Canal não encontrado. Confira o @handle ou o link.",
  quota: "Limite diário de consultas ao YouTube atingido. Tente novamente amanhã.",
  key: "A integração com o YouTube está com problema de configuração. Avise o suporte.",
  unavailable: "O YouTube não respondeu. Tente novamente em instantes.",
}

const thumb = z.object({ url: z.string() }).optional()

const channelItemSchema = z.object({
  id: z.string(),
  snippet: z.object({
    title: z.string(),
    description: z.string().default(""),
    customUrl: z.string().optional(),
    publishedAt: z.string().optional(),
    country: z.string().optional(),
    thumbnails: z.object({ default: thumb, medium: thumb, high: thumb }).optional(),
  }),
  statistics: z
    .object({
      viewCount: z.coerce.number().optional(),
      subscriberCount: z.coerce.number().optional(),
      hiddenSubscriberCount: z.boolean().optional(),
      videoCount: z.coerce.number().optional(),
    })
    .optional(),
  contentDetails: z.object({ relatedPlaylists: z.object({ uploads: z.string().optional() }) }).optional(),
})

export type ChannelItem = z.infer<typeof channelItemSchema>

const listSchema = z.object({ items: z.array(z.unknown()).optional() })
const errorSchema = z.object({
  error: z.object({ errors: z.array(z.object({ reason: z.string().optional() })).optional() }).optional(),
})

async function trackUsage(units: number) {
  const { error } = await createAdminClient().rpc("increment_youtube_usage", { units })
  if (error) console.error("[youtube] falha ao registrar cota:", error.message)
}

function errorFromResponse(status: number, body: unknown): YoutubeError {
  const reasons = errorSchema.safeParse(body).data?.error?.errors?.map((e) => e.reason) ?? []
  const code: YoutubeErrorCode = reasons.some((r) => r === "quotaExceeded" || r === "dailyLimitExceeded")
    ? "quota"
    : status === 400 || status === 403
      ? "key"
      : "unavailable"
  console.error(`[youtube] HTTP ${status}`, reasons.join(", "))
  return new YoutubeError(code, MESSAGES[code])
}

/** channels.list (1 unidade). Lança YoutubeError com mensagem pronta para o usuário. */
export async function fetchChannel(lookup: ChannelLookup): Promise<ChannelItem> {
  const key = env.YOUTUBE_API_KEY
  if (!key) throw new YoutubeError("not_configured", MESSAGES.not_configured)

  const params = new URLSearchParams({ part: "snippet,statistics,contentDetails", key })
  if ("id" in lookup) params.set("id", lookup.id)
  else params.set("forHandle", lookup.handle)

  let res: Response
  try {
    res = await fetch(`${API}/channels?${params}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) })
  } catch {
    throw new YoutubeError("unavailable", MESSAGES.unavailable)
  }

  await trackUsage(1)
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) throw errorFromResponse(res.status, body)

  const first = listSchema.safeParse(body).data?.items?.[0]
  if (!first) throw new YoutubeError("not_found", MESSAGES.not_found)

  const parsed = channelItemSchema.safeParse(first)
  if (!parsed.success) {
    console.error("[youtube] resposta inesperada:", parsed.error.message)
    throw new YoutubeError("unavailable", MESSAGES.unavailable)
  }
  return parsed.data
}
