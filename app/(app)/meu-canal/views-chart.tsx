import type { YoutubeVideo } from "@/lib/supabase/database.types"

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 })
const full = new Intl.NumberFormat("pt-BR")
const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" })

type Video = Pick<YoutubeVideo, "id" | "title" | "published_at" | "view_count" | "is_short">

/**
 * Views por vídeo (série única, em ordem de publicação). Barras finas em bg-primary com 2px de espaço,
 * pontas arredondadas de 4px ancoradas na base, grade recessiva e tooltip por barra (hover/foco).
 * A tabela abaixo na página é a visão em tabela dos mesmos dados.
 */
export function ViewsChart({ videos }: { videos: Video[] }) {
  const data = [...videos]
    .filter((v) => v.view_count !== null)
    .sort((a, b) => new Date(a.published_at ?? 0).getTime() - new Date(b.published_at ?? 0).getTime())
  if (data.length === 0) return <p className="text-sm text-muted-foreground">Ainda não há views para mostrar.</p>

  const max = Math.max(...data.map((v) => v.view_count ?? 0), 1)
  const first = data[0]
  const last = data[data.length - 1]

  return (
    <figure className="flex flex-col gap-2">
      <div className="flex items-end justify-between text-xs text-muted-foreground tabular-nums">
        <span>{compact.format(max)} views</span>
      </div>
      <div
        className="relative flex h-48 items-end gap-0.5 border-b border-border"
        role="img"
        aria-label={`Views dos ${data.length} vídeos mais recentes, de ${compact.format(0)} a ${compact.format(max)}`}
      >
        {/* Grade recessiva: metade e topo */}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-border" />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-border" />

        {data.map((v) => {
          const height = Math.max(2, ((v.view_count ?? 0) / max) * 100)
          return (
            <div key={v.id} className="group relative flex h-full min-w-0 flex-1 items-end" tabIndex={0}>
              <div
                className="w-full rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80"
                style={{ height: `${height}%` }}
              />
              {/* Alvo de hover maior que a barra: a coluna inteira */}
              <div
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-56 -translate-x-1/2 rounded-lg border border-border bg-popover p-2.5 text-xs text-popover-foreground shadow-sm group-hover:block group-focus-visible:block"
              >
                <p className="line-clamp-2 font-semibold">{v.title}</p>
                <p className="mt-1 text-muted-foreground tabular-nums">
                  {full.format(v.view_count ?? 0)} views · {v.published_at ? day.format(new Date(v.published_at)) : "—"}
                  {v.is_short ? " · Short" : ""}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      <figcaption className="flex justify-between text-xs text-muted-foreground">
        <span>{first.published_at ? day.format(new Date(first.published_at)) : ""}</span>
        <span>Ordem de publicação</span>
        <span>{last.published_at ? day.format(new Date(last.published_at)) : ""}</span>
      </figcaption>
    </figure>
  )
}
