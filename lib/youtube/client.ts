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
  brandingSettings: z
    .object({
      channel: z.object({ keywords: z.string().optional() }).optional(),
      image: z.object({ bannerExternalUrl: z.string().optional() }).optional(),
    })
    .optional(),
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
    : status === 404
      ? "not_found"
      : status === 400 || status === 403
        ? "key"
        : "unavailable"
  console.error(`[youtube] HTTP ${status}`, reasons.join(", "))
  return new YoutubeError(code, MESSAGES[code])
}

/** GET na API (1 unidade por chamada, registrada na cota do dia). */
async function apiGet(path: string, query: Record<string, string>): Promise<unknown> {
  const key = env.YOUTUBE_API_KEY
  if (!key) throw new YoutubeError("not_configured", MESSAGES.not_configured)

  let res: Response
  try {
    res = await fetch(`${API}/${path}?${new URLSearchParams({ ...query, key })}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new YoutubeError("unavailable", MESSAGES.unavailable)
  }

  await trackUsage(1)
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) throw errorFromResponse(res.status, body)
  return body
}

/** channels.list (1 unidade). Lança YoutubeError com mensagem pronta para o usuário. */
export async function fetchChannel(lookup: ChannelLookup): Promise<ChannelItem> {
  const query: Record<string, string> = { part: "snippet,statistics,contentDetails,brandingSettings" }
  if ("id" in lookup) query.id = lookup.id
  else query.forHandle = lookup.handle

  const body = await apiGet("channels", query)
  const first = listSchema.safeParse(body).data?.items?.[0]
  if (!first) throw new YoutubeError("not_found", MESSAGES.not_found)

  const parsed = channelItemSchema.safeParse(first)
  if (!parsed.success) {
    console.error("[youtube] resposta inesperada:", parsed.error.message)
    throw new YoutubeError("unavailable", MESSAGES.unavailable)
  }
  return parsed.data
}

const playlistSchema = z.object({
  items: z.array(z.object({ contentDetails: z.object({ videoId: z.string() }) })).default([]),
})

/** playlistItems.list da playlist de uploads (1 unidade): ids dos 50 vídeos mais recentes. */
export async function fetchUploadIds(playlistId: string): Promise<string[]> {
  try {
    const body = await apiGet("playlistItems", { part: "contentDetails", playlistId, maxResults: "50" })
    return playlistSchema.parse(body).items.map((i) => i.contentDetails.videoId)
  } catch (error) {
    // Canal sem vídeos públicos: a playlist de uploads não existe (404).
    if (error instanceof YoutubeError && error.code === "not_found") return []
    throw error
  }
}

const videoItemSchema = z.object({
  id: z.string(),
  snippet: z.object({
    title: z.string(),
    publishedAt: z.string().optional(),
    thumbnails: z.object({ default: thumb, medium: thumb, high: thumb }).optional(),
  }),
  contentDetails: z.object({ duration: z.string().optional() }).optional(),
  statistics: z
    .object({
      viewCount: z.coerce.number().optional(),
      likeCount: z.coerce.number().optional(),
      commentCount: z.coerce.number().optional(),
    })
    .optional(),
})

export type VideoItem = z.infer<typeof videoItemSchema>

/** videos.list (1 unidade para até 50 ids). */
export async function fetchVideos(ids: string[]): Promise<VideoItem[]> {
  if (ids.length === 0) return []
  const body = await apiGet("videos", { part: "snippet,statistics,contentDetails", id: ids.slice(0, 50).join(",") })
  const items = listSchema.safeParse(body).data?.items ?? []
  return items.flatMap((item) => {
    const parsed = videoItemSchema.safeParse(item)
    return parsed.success ? [parsed.data] : []
  })
}

/** Duração ISO 8601 (PT1H2M3S, P1DT2H) em segundos. */
export function parseDuration(iso?: string): number | null {
  const m = iso?.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
  if (!m) return null
  const [, d, h, min, s] = m.map((v) => Number(v ?? 0))
  return d * 86400 + h * 3600 + min * 60 + s
}
