import type { Metadata } from "next"
import Link from "next/link"
import { after } from "next/server"
import { Suspense } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit02Icon, LinkSquare01Icon, YoutubeIcon } from "@hugeicons/core-free-icons"
import { PageHeader } from "@/components/layout/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChannelDialog, RefreshChannelButton } from "@/components/youtube/channel-forms"
import { requireUser } from "@/lib/auth/dal"
import { NOTICE } from "@/lib/status-colors"
import { createClient } from "@/lib/supabase/server"
import type { YoutubeVideo } from "@/lib/supabase/database.types"
import { isExpired, refreshIfStale, videosExpired } from "@/lib/youtube/channel-cache"
import { isYoutubeConfigured } from "@/lib/youtube/client"
import { ViewsChart } from "./views-chart"

export const metadata: Metadata = { title: "Meu canal · CCD Studio" }

const HEADER = { eyebrow: "Conta", title: "Meu canal", icon: "channel" as const }
const PAGE_SIZE = 10
const CHART_SIZE = 20

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 })
const full = new Intl.NumberFormat("pt-BR")
const oneDecimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" })
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })
const monthYear = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" })
const regionName = new Intl.DisplayNames(["pt-BR"], { type: "region" })

function duration(seconds: number | null) {
  if (seconds === null) return "—"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = String(seconds % 60).padStart(2, "0")
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`
}

function count(value: number | null, empty = "—") {
  return value === null ? <span className="text-muted-foreground">{empty}</span> : full.format(value)
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-5">
      <span className="label">{label}</span>
      <span className="font-heading text-3xl font-extrabold tracking-[-0.03em] tabular-nums">{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}

function videoUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`
}

async function Channel({ searchParams }: { searchParams: PageProps<"/meu-canal">["searchParams"] }) {
  const user = await requireUser()
  const configured = isYoutubeConfigured()
  const supabase = await createClient()

  const channel = user.youtube_channel_id
    ? (await supabase.from("youtube_channels").select("*").eq("id", user.youtube_channel_id).maybeSingle()).data
    : null

  if (!channel) {
    return (
      <>
        <PageHeader {...HEADER} description="Os números públicos do seu canal do YouTube, num painel só." />
        <section className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HugeiconsIcon icon={YoutubeIcon} strokeWidth={1.5} className="size-7" />
          </span>
          <div className="flex max-w-md flex-col gap-1.5">
            <h2 className="text-xl font-bold">Adicione o seu canal</h2>
            <p className="text-sm text-muted-foreground">
              Informe o @handle ou o link do canal. Buscamos os dados públicos na hora (inscritos, visualizações e os
              últimos 50 vídeos) e montamos o seu painel.
            </p>
          </div>
          {configured ? (
            <ChannelDialog />
          ) : (
            <p className={NOTICE.warning}>A integração com o YouTube ainda não foi configurada.</p>
          )}
        </section>
      </>
    )
  }

  // Canais salvos antes do banner (sem brandingSettings) também renovam uma vez.
  const raw = channel.raw
  const missingBranding = typeof raw === "object" && raw !== null && !Array.isArray(raw) && !("brandingSettings" in raw)
  if (isExpired(channel) || videosExpired(channel) || missingBranding) {
    after(() => refreshIfStale(channel.id, { force: missingBranding }))
  }

  const { data: videoRows } = await supabase
    .from("youtube_videos")
    .select("id, title, published_at, thumbnail_url, duration_seconds, is_short, view_count, like_count, comment_count")
    .eq("channel_id", channel.id)
    .order("published_at", { ascending: false })
  const videos = (videoRows ?? []) as Omit<YoutubeVideo, "channel_id" | "fetched_at">[]

  // Indicadores dos vídeos salvos (últimos 50)
  const withViews = videos.filter((v) => v.view_count !== null)
  const avgViews = withViews.length ? withViews.reduce((s, v) => s + (v.view_count ?? 0), 0) / withViews.length : null
  const ninetyDaysAgo = Date.now() - 90 * 86400_000
  const recent = videos.filter((v) => v.published_at && new Date(v.published_at).getTime() >= ninetyDaysAgo).length
  const perWeek = recent / (90 / 7)
  const shorts = videos.filter((v) => v.is_short).length
  const top = [...withViews].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0)).slice(0, 5)

  const params = await searchParams
  const totalPages = Math.max(1, Math.ceil(videos.length / PAGE_SIZE))
  const page = Math.min(totalPages, Math.max(1, Number(params.pagina) || 1))
  const pageVideos = videos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Resumo ao lado do "Sobre": métricas básicas derivadas do que já está salvo.
  const ageYears = channel.published_at ? (Date.now() - new Date(channel.published_at).getTime()) / (365.25 * 86400_000) : null
  const lastVideo = videos.find((v) => v.published_at)
  const daysSinceLast = lastVideo?.published_at
    ? Math.floor((Date.now() - new Date(lastVideo.published_at).getTime()) / 86400_000)
    : null
  const viewsPerVideo = channel.view_count !== null && channel.video_count ? channel.view_count / channel.video_count : null
  const engagementBase = withViews.filter((v) => (v.view_count ?? 0) > 0)
  const totalViewsRecent = engagementBase.reduce((s, v) => s + (v.view_count ?? 0), 0)
  const interactions = engagementBase.reduce((s, v) => s + (v.like_count ?? 0) + (v.comment_count ?? 0), 0)
  const engagement = totalViewsRecent > 0 ? (interactions / totalViewsRecent) * 100 : null
  const longs = videos.filter((v) => !v.is_short && v.duration_seconds !== null)
  const avgLong = longs.length ? longs.reduce((s, v) => s + (v.duration_seconds ?? 0), 0) / longs.length : null

  const summary = [
    {
      label: "Idade do canal",
      value: ageYears === null ? "—" : ageYears < 1 ? "Menos de 1 ano" : `${Math.floor(ageYears)} ${Math.floor(ageYears) === 1 ? "ano" : "anos"}`,
    },
    {
      label: "Último vídeo",
      value: daysSinceLast === null ? "—" : daysSinceLast === 0 ? "Hoje" : `Há ${daysSinceLast} ${daysSinceLast === 1 ? "dia" : "dias"}`,
    },
    {
      label: "Views por vídeo",
      value: viewsPerVideo === null ? "—" : compact.format(viewsPerVideo),
      hint: "Média de todo o canal",
    },
    {
      label: "Engajamento",
      value: engagement === null ? "—" : `${oneDecimal.format(engagement)}%`,
      hint: "Likes + comentários por view",
    },
    {
      label: "Duração média",
      value: avgLong === null ? "—" : duration(Math.round(avgLong)),
      hint: "Vídeos longos recentes",
    },
    {
      label: "Inscritos por vídeo",
      value:
        channel.subscriber_count === null || !channel.video_count
          ? "—"
          : compact.format(channel.subscriber_count / channel.video_count),
      hint: "Média de todo o canal",
    },
  ]

  const handle = channel.handle ?? undefined
  const url = handle ? `https://www.youtube.com/${handle}` : `https://www.youtube.com/channel/${channel.id}`
  const meta = [
    channel.country ? regionName.of(channel.country) : null,
    channel.published_at ? `no YouTube desde ${monthYear.format(new Date(channel.published_at))}` : null,
  ].filter(Boolean)

  return (
    <>
      <PageHeader
        {...HEADER}
        description="Dados públicos do seu canal, salvos e atualizados automaticamente a cada 24 horas."
        actions={
          <>
            <RefreshChannelButton disabled={!configured} />
            <Link href="/perfil#canal" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <HugeiconsIcon icon={Edit02Icon} strokeWidth={1.75} data-icon="inline-start" />
              Editar no Perfil
            </Link>
          </>
        }
      />

      {/* Canal: banner + identidade */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative aspect-[6/1] min-h-28 w-full bg-primary/10">
          {channel.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={channel.banner_url}
              alt={`Banner do canal ${channel.title}`}
              referrerPolicy="no-referrer"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <span aria-hidden className="absolute inset-0 flex items-center justify-center text-primary/30">
              <HugeiconsIcon icon={YoutubeIcon} strokeWidth={1.25} className="size-16" />
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:gap-5">
          <Avatar className="-mt-10 size-24 shrink-0 ring-4 ring-card sm:-mt-12 sm:size-28">
            {channel.thumbnail_url ? <AvatarImage src={channel.thumbnail_url} alt="" referrerPolicy="no-referrer" /> : null}
            <AvatarFallback className="text-3xl">{channel.title.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:pt-4">
            <h2 className="truncate text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">{channel.title}</h2>
            <p className="text-sm text-muted-foreground">
              {[handle, channel.subscriber_count === null ? null : `${compact.format(channel.subscriber_count)} inscritos`, channel.video_count === null ? null : `${full.format(channel.video_count)} vídeos`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm", className: "self-start sm:self-end" })}
          >
            <HugeiconsIcon icon={LinkSquare01Icon} strokeWidth={1.75} data-icon="inline-start" />
            Ver no YouTube
          </a>
        </div>

        <div className="grid gap-6 border-t border-border px-6 py-5 lg:grid-cols-[1fr_minmax(0,340px)]">
          <div className="flex min-w-0 flex-col gap-2">
            <span className="label">Sobre o canal</span>
            {channel.description ? (
              <p className="line-clamp-4 text-sm whitespace-pre-line text-foreground">{channel.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">O canal não tem descrição.</p>
            )}
            {meta.length ? <p className="text-xs text-muted-foreground">{meta.join(" · ")}</p> : null}
            {channel.keywords.length ? (
              // Uma linha só: o que não cabe some num degradê (lista completa no title).
              <div
                className="mt-1 flex flex-nowrap gap-1.5 overflow-hidden [mask-image:linear-gradient(to_right,black_85%,transparent)]"
                title={channel.keywords.join(" · ")}
                aria-label={`Palavras-chave do canal: ${channel.keywords.join(", ")}`}
              >
                {channel.keywords.map((k) => (
                  <Badge key={k} variant="outline" className="shrink-0 font-medium">
                    {k}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 self-start lg:border-l lg:border-border lg:pl-6">
            {summary.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-col gap-0.5">
                <dt className="label">{item.label}</dt>
                <dd className="font-heading text-lg font-bold tracking-[-0.02em] tabular-nums">{item.value}</dd>
                {item.hint ? <dd className="text-xs text-muted-foreground">{item.hint}</dd> : null}
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Indicadores */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Inscritos"
          value={channel.subscriber_count === null ? "Oculto" : compact.format(channel.subscriber_count)}
          hint={channel.subscriber_count === null ? "O dono do canal ocultou o número" : full.format(channel.subscriber_count)}
        />
        <Stat
          label="Visualizações totais"
          value={channel.view_count === null ? "—" : compact.format(channel.view_count)}
          hint={channel.view_count === null ? undefined : full.format(channel.view_count)}
        />
        <Stat label="Vídeos publicados" value={channel.video_count === null ? "—" : full.format(channel.video_count)} />
        <Stat
          label="Média de views"
          value={avgViews === null ? "—" : compact.format(avgViews)}
          hint={`Nos ${withViews.length} vídeos mais recentes`}
        />
        <Stat label="Vídeos por semana" value={oneDecimal.format(perWeek)} hint={`${recent} publicados nos últimos 90 dias`} />
        <Stat
          label="Shorts × longos"
          value={`${shorts} × ${videos.length - shorts}`}
          hint="Short = até 3 minutos (estimativa pela duração)"
        />
      </div>

      {videos.length > 0 ? (
        <>
          <SectionCard
            title="Views por vídeo"
            description={`Os ${Math.min(CHART_SIZE, videos.length)} vídeos mais recentes, em ordem de publicação. Passe o mouse para ver o vídeo.`}
          >
            <ViewsChart videos={videos.slice(0, CHART_SIZE)} />
          </SectionCard>

          <SectionCard title="Mais vistos" description="Os 5 vídeos com mais views entre os 50 mais recentes.">
            <ol className="flex flex-col gap-3">
              {top.map((v, i) => (
                <li key={v.id} className="flex items-center gap-3">
                  <span className="w-5 text-right font-heading text-lg font-extrabold text-muted-foreground tabular-nums">{i + 1}</span>
                  {v.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnail_url} alt="" referrerPolicy="no-referrer" loading="lazy" className="aspect-video w-24 shrink-0 rounded-md object-cover" />
                  ) : null}
                  <div className="flex min-w-0 flex-col">
                    <a href={videoUrl(v.id)} target="_blank" rel="noopener noreferrer" className="truncate text-sm font-semibold hover:underline">
                      {v.title}
                    </a>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {full.format(v.view_count ?? 0)} views · {v.published_at ? date.format(new Date(v.published_at)) : "—"}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>
        </>
      ) : null}

      {/* Vídeos recentes */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-base font-bold">Vídeos recentes</h2>
          <span className="text-sm text-muted-foreground">{videos.length} vídeos salvos</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="label px-4">Vídeo</TableHead>
              <TableHead className="label">Título</TableHead>
              <TableHead className="label">Publicado</TableHead>
              <TableHead className="label">Duração</TableHead>
              <TableHead className="label">Tipo</TableHead>
              <TableHead className="label text-right">Views</TableHead>
              <TableHead className="label text-right">Likes</TableHead>
              <TableHead className="label px-4 text-right">Comentários</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageVideos.length > 0 ? (
              pageVideos.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="px-4">
                    {v.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.thumbnail_url} alt="" referrerPolicy="no-referrer" loading="lazy" className="aspect-video w-20 rounded-md object-cover" />
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-80">
                    <a href={videoUrl(v.id)} target="_blank" rel="noopener noreferrer" className="line-clamp-2 font-semibold whitespace-normal hover:underline">
                      {v.title}
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{v.published_at ? date.format(new Date(v.published_at)) : "—"}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{duration(v.duration_seconds)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{v.is_short ? "Short" : "Longo"}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{count(v.view_count)}</TableCell>
                  <TableCell className="text-right tabular-nums">{count(v.like_count, "Oculto")}</TableCell>
                  <TableCell className="px-4 text-right tabular-nums">{count(v.comment_count, "Desativados")}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  {channel.videos_fetched_at
                    ? "Este canal ainda não tem vídeos públicos."
                    : "Os vídeos ainda estão sendo carregados. Use “Atualizar” em instantes."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground tabular-nums">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link href={`/meu-canal?pagina=${page - 1}`} scroll={false} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Anterior
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link href={`/meu-canal?pagina=${page + 1}`} scroll={false} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Próxima
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Dados públicos do YouTube · canal atualizado em {dateTime.format(new Date(channel.fetched_at))}
        {channel.videos_fetched_at ? ` · vídeos em ${dateTime.format(new Date(channel.videos_fetched_at))}` : ""}
      </p>
    </>
  )
}

export default function MyChannelPage({ searchParams }: PageProps<"/meu-canal">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} description="Carregando…" />
          <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <Channel searchParams={searchParams} />
    </Suspense>
  )
}
