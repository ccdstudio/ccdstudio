import "server-only"
import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import type { InsightVideo } from "./channel-insights"

const VIDEO_COLUMNS = "id, title, published_at, thumbnail_url, duration_seconds, is_short, view_count, like_count, comment_count"

/** Canal + vídeos salvos do usuário logado (RLS: só o canal ligado ao próprio perfil). */
export const getMyChannelData = cache(async (channelId: string | null) => {
  if (!channelId) return null
  const supabase = await createClient()
  const [{ data: channel }, { data: videos }] = await Promise.all([
    supabase.from("youtube_channels").select("*").eq("id", channelId).maybeSingle(),
    supabase.from("youtube_videos").select(VIDEO_COLUMNS).eq("channel_id", channelId).order("published_at", { ascending: false }),
  ])
  if (!channel) return null
  return { channel, videos: (videos ?? []) as InsightVideo[] }
})
