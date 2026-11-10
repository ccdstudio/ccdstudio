import "server-only"
import type { Json, YoutubeChannel } from "@/lib/supabase/database.types"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchChannel, fetchUploadIds, fetchVideos, isYoutubeConfigured, parseDuration, type ChannelItem } from "./client"

// Cache das respostas da API em public.youtube_channels.
// Validade de 24h: dentro dela, nenhuma chamada nova à API para o mesmo canal.

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000
/** Intervalo mínimo entre atualizações manuais ("Atualizar"). */
export const MANUAL_REFRESH_MS = 60 * 60 * 1000

export function isExpired(channel: Pick<YoutubeChannel, "expires_at">) {
  return new Date(channel.expires_at).getTime() <= Date.now()
}

/** Palavras-chave do canal: separadas por espaço, com aspas para termos compostos. */
export function parseKeywords(raw?: string): string[] {
  const found = raw?.match(/"[^"]+"|\S+/g) ?? []
  return [...new Set(found.map((k) => k.replace(/"/g, "").trim()).filter(Boolean))].slice(0, 30)
}

/** Banner em largura útil: o Google redimensiona pelo sufixo da URL (recorte da área segura de TV/desktop). */
export function bannerUrl(raw?: string) {
  if (!raw) return null
  return raw.includes("=") ? raw : `${raw}=w2120-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj`
}

export async function upsertChannel(item: ChannelItem): Promise<YoutubeChannel> {
  const now = new Date()
  const { snippet, statistics, contentDetails, brandingSettings } = item
  const thumbs = snippet.thumbnails
  const row = {
    id: item.id,
    handle: snippet.customUrl ?? null,
    title: snippet.title,
    description: snippet.description,
    thumbnail_url: thumbs?.medium?.url ?? thumbs?.high?.url ?? thumbs?.default?.url ?? null,
    country: snippet.country ?? null,
    published_at: snippet.publishedAt ?? null,
    uploads_playlist_id: contentDetails?.relatedPlaylists.uploads ?? null,
    subscriber_count: statistics?.hiddenSubscriberCount ? null : (statistics?.subscriberCount ?? null),
    view_count: statistics?.viewCount ?? null,
    video_count: statistics?.videoCount ?? null,
    banner_url: bannerUrl(brandingSettings?.image?.bannerExternalUrl),
    keywords: parseKeywords(brandingSettings?.channel?.keywords),
    raw: item as unknown as Json,
    fetched_at: now.toISOString(),
    expires_at: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
  }

  const { data, error } = await createAdminClient().from("youtube_channels").upsert(row).select().single()
  if (error) throw new Error(`Falha ao salvar canal no cache: ${error.message}`)
  return data
}

export async function getCachedChannel(id: string): Promise<YoutubeChannel | null> {
  const { data } = await createAdminClient().from("youtube_channels").select("*").eq("id", id).maybeSingle()
  return data
}

const MAX_SHORT_SECONDS = 180

export function videosExpired(channel: Pick<YoutubeChannel, "videos_fetched_at">) {
  return !channel.videos_fetched_at || Date.now() - new Date(channel.videos_fetched_at).getTime() >= CACHE_TTL_MS
}

/**
 * Salva os 50 vídeos mais recentes do canal (2 unidades: playlistItems + videos) e apaga os que saíram da janela.
 */
export async function syncChannelVideos(channel: Pick<YoutubeChannel, "id" | "uploads_playlist_id">) {
  const admin = createAdminClient()
  const ids = channel.uploads_playlist_id ? await fetchUploadIds(channel.uploads_playlist_id) : []
  const videos = await fetchVideos(ids)
  const now = new Date().toISOString()

  if (videos.length > 0) {
    const rows = videos.map((v) => {
      const duration = parseDuration(v.contentDetails?.duration)
      const thumbs = v.snippet.thumbnails
      return {
        id: v.id,
        channel_id: channel.id,
        title: v.snippet.title,
        published_at: v.snippet.publishedAt ?? null,
        thumbnail_url: thumbs?.medium?.url ?? thumbs?.default?.url ?? thumbs?.high?.url ?? null,
        duration_seconds: duration,
        is_short: duration !== null && duration <= MAX_SHORT_SECONDS,
        view_count: v.statistics?.viewCount ?? null,
        like_count: v.statistics?.likeCount ?? null,
        comment_count: v.statistics?.commentCount ?? null,
        fetched_at: now,
      }
    })
    const { error } = await admin.from("youtube_videos").upsert(rows)
    if (error) throw new Error(`Falha ao salvar vídeos: ${error.message}`)
  }

  // Mantém só a janela atual (renovar ou apagar em até 30 dias: política do YouTube).
  let cleanup = admin.from("youtube_videos").delete().eq("channel_id", channel.id)
  if (videos.length > 0) cleanup = cleanup.not("id", "in", `(${videos.map((v) => `"${v.id}"`).join(",")})`)
  await cleanup

  await admin.from("youtube_channels").update({ videos_fetched_at: now }).eq("id", channel.id)
  return videos.length
}

/** Busca canal + vídeos na API e grava tudo (≈3 unidades). Falha nos vídeos não desfaz o canal. */
export async function syncChannel(item: ChannelItem) {
  const channel = await upsertChannel(item)
  try {
    await syncChannelVideos(channel)
    return { channel, videosOk: true }
  } catch (error) {
    console.error("[youtube] falha ao sincronizar vídeos", channel.id, error instanceof Error ? error.message : error)
    return { channel, videosOk: false }
  }
}

/** Renova canal e/ou vídeos só se estiverem vencidos. Erros são registrados, nunca lançados (uso em segundo plano). */
export async function refreshIfStale(id: string, { force = false }: { force?: boolean } = {}) {
  if (!isYoutubeConfigured()) return
  try {
    let cached = await getCachedChannel(id)
    if (!cached || force || isExpired(cached)) cached = await upsertChannel(await fetchChannel({ id }))
    if (videosExpired(cached)) await syncChannelVideos(cached)
  } catch (error) {
    console.error("[youtube] falha ao renovar o canal", id, error instanceof Error ? error.message : error)
  }
}

/** Apaga o cache de um canal que nenhum usuário usa mais (política do YouTube: não guardar dados sem uso). */
export async function deleteIfOrphan(id: string | null | undefined) {
  if (!id) return
  const admin = createAdminClient()
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("youtube_channel_id", id)
  if (!error && count === 0) await admin.from("youtube_channels").delete().eq("id", id)
}
