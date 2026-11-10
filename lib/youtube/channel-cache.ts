import "server-only"
import type { Json, YoutubeChannel } from "@/lib/supabase/database.types"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchChannel, isYoutubeConfigured, type ChannelItem } from "./client"

// Cache das respostas da API em public.youtube_channels.
// Validade de 24h: dentro dela, nenhuma chamada nova à API para o mesmo canal.

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000
/** Intervalo mínimo entre atualizações manuais ("Atualizar"). */
export const MANUAL_REFRESH_MS = 60 * 60 * 1000

export function isExpired(channel: Pick<YoutubeChannel, "expires_at">) {
  return new Date(channel.expires_at).getTime() <= Date.now()
}

export async function upsertChannel(item: ChannelItem): Promise<YoutubeChannel> {
  const now = new Date()
  const { snippet, statistics, contentDetails } = item
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

/** Renova o cache só se estiver vencido. Erros são registrados, nunca lançados (uso em segundo plano). */
export async function refreshIfStale(id: string) {
  if (!isYoutubeConfigured()) return
  try {
    const cached = await getCachedChannel(id)
    if (cached && !isExpired(cached)) return
    await upsertChannel(await fetchChannel({ id }))
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
