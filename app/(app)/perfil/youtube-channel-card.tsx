import { after } from "next/server"
import { HugeiconsIcon } from "@hugeicons/react"
import { LinkSquare01Icon, YoutubeIcon } from "@hugeicons/core-free-icons"
import { DataList } from "@/components/shared/data-list"
import { SectionCard } from "@/components/shared/section-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/server"
import { isExpired, refreshIfStale } from "@/lib/youtube/channel-cache"
import { isYoutubeConfigured } from "@/lib/youtube/client"
import { ChannelDialog, RefreshChannelButton, RemoveChannelDialog } from "./youtube-channel-forms"

const TITLE = "Canal do YouTube"
const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 })
const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
})

function count(value: number | null, hidden = "—") {
  return value === null ? <span className="text-muted-foreground">{hidden}</span> : compact.format(value)
}

export function YoutubeChannelCardSkeleton() {
  return (
    <SectionCard title={TITLE} description="Carregando…">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </SectionCard>
  )
}

// Leitura do cache (RLS: o usuário só lê o próprio canal). Se o cache venceu, renova
// depois da resposta (after), sem fazer a página esperar pela API do YouTube.
export async function YoutubeChannelCard({ channelId }: { channelId: string | null }) {
  const configured = isYoutubeConfigured()

  const channel = channelId
    ? (await (await createClient()).from("youtube_channels").select("*").eq("id", channelId).maybeSingle()).data
    : null

  if (channel && isExpired(channel)) after(() => refreshIfStale(channel.id))

  if (!channel) {
    return (
      <SectionCard
        title={TITLE}
        description="Informe o seu canal para usarmos os dados públicos nas ferramentas."
        actions={<ChannelDialog disabled={!configured} />}
      >
        <div className="flex h-full items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          <HugeiconsIcon icon={YoutubeIcon} strokeWidth={1.5} className="size-6 shrink-0 text-primary" />
          {configured
            ? "Nenhum canal vinculado ainda."
            : "A integração com o YouTube ainda não foi configurada. Em breve você poderá vincular o seu canal."}
        </div>
      </SectionCard>
    )
  }

  const handle = channel.handle ?? undefined
  const url = handle ? `https://www.youtube.com/${handle}` : `https://www.youtube.com/channel/${channel.id}`

  return (
    <SectionCard
      title={TITLE}
      description="Dados públicos do YouTube, atualizados automaticamente a cada 24 horas."
      actions={
        <>
          <ChannelDialog current={handle ?? channel.id} disabled={!configured} />
          <RefreshChannelButton disabled={!configured} />
          <RemoveChannelDialog title={channel.title} />
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="size-12">
            {channel.thumbnail_url ? <AvatarImage src={channel.thumbnail_url} alt="" referrerPolicy="no-referrer" /> : null}
            <AvatarFallback>{channel.title.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-bold">{channel.title}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {handle ?? "Ver no YouTube"}
              <HugeiconsIcon icon={LinkSquare01Icon} strokeWidth={1.75} className="size-3.5" />
            </a>
          </div>
        </div>

        <DataList
          className="sm:grid-cols-3"
          items={[
            { label: "Inscritos", value: count(channel.subscriber_count, "Oculto") },
            { label: "Visualizações", value: count(channel.view_count) },
            { label: "Vídeos", value: count(channel.video_count) },
            { label: "Atualizado em", value: dateTime.format(new Date(channel.fetched_at)), wide: true },
          ]}
        />
      </div>
    </SectionCard>
  )
}
