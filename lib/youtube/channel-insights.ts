// Métricas calculadas sobre os vídeos salvos do canal (sem IA, sem custo).
// "Estouro" segue a skill yt-viral: views como MÚLTIPLO DA MEDIANA DO PRÓPRIO CANAL, porque número bruto mede o
// tamanho do canal, não a ideia. Shorts e longos têm medianas separadas (públicos e escalas diferentes).

import { classifyTitle } from "./formulas"
import { lintTitle } from "./title-lint"

export type InsightVideo = {
  id: string
  title: string
  published_at: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  is_short: boolean
  view_count: number | null
  like_count: number | null
  comment_count: number | null
}

const TZ = "America/Sao_Paulo"
const DAY_MS = 86_400_000
/** Mínimo de vídeos num grupo para a mediana significar algo (regra do swipe.py). */
export const MIN_GROUP = 4

export function median(values: number[]) {
  if (!values.length) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

const views = (v: InsightVideo) => v.view_count ?? 0
const hasViews = (v: InsightVideo) => v.view_count !== null

// ---------------------------------------------------------------------------------------------------------------
// Estouros

export type Outlier = InsightVideo & { multiple: number; groupMedian: number; formula: { id: string; nome: string } }

export type OutlierGroup = {
  kind: "longos" | "shorts"
  count: number
  median: number | null
  /** false quando há menos de MIN_GROUP vídeos: não ranqueia. */
  enough: boolean
  top: Outlier[]
}

function groupOutliers(kind: OutlierGroup["kind"], videos: InsightVideo[], limit: number): OutlierGroup {
  const withViews = videos.filter(hasViews)
  const med = median(withViews.map(views))
  const enough = withViews.length >= MIN_GROUP && !!med
  const top = enough
    ? withViews
        .map((v) => ({ ...v, multiple: views(v) / med!, groupMedian: med!, formula: classifyTitle(v.title) }))
        .sort((a, b) => b.multiple - a.multiple)
        .slice(0, limit)
    : []
  return { kind, count: withViews.length, median: med, enough, top }
}

export function outliers(videos: InsightVideo[], limit = 5) {
  return {
    longos: groupOutliers("longos", videos.filter((v) => !v.is_short), limit),
    shorts: groupOutliers("shorts", videos.filter((v) => v.is_short), limit),
  }
}

/** Estouros de verdade: 1,5× ou mais sobre a mediana do grupo. */
export const OUTLIER_MIN = 1.5

/** O que os estouros têm em comum (calculado): fórmula mais frequente, duração típica e dia da semana. */
export function commonPattern(items: Outlier[]) {
  const hits = items.filter((o) => o.multiple >= OUTLIER_MIN)
  if (hits.length < 2) return null
  const tally = <T extends string>(xs: T[]) =>
    Object.entries(
      xs.reduce<Record<string, number>>((acc, x) => ((acc[x] = (acc[x] ?? 0) + 1), acc), {})
    ).sort((a, b) => b[1] - a[1])[0]
  const formula = tally(hits.map((o) => o.formula.nome))
  const day = tally(hits.filter((o) => o.published_at).map((o) => weekdayName(new Date(o.published_at!))))
  const dur = median(hits.filter((o) => o.duration_seconds !== null).map((o) => o.duration_seconds!))
  return {
    count: hits.length,
    formula: formula && formula[1] >= 2 && formula[0] !== "Sem fórmula" ? { nome: formula[0], vezes: formula[1] } : null,
    weekday: day && day[1] >= 2 ? { nome: day[0], vezes: day[1] } : null,
    medianDuration: dur,
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Dia da semana

const WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]
const weekdayIndex = (d: Date) =>
  WEEKDAYS.indexOf(new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: TZ }).format(d).replace("-feira", ""))
export const weekdayName = (d: Date) => WEEKDAYS[weekdayIndex(d)] ?? ""

export type WeekdayStat = { day: string; index: number; videos: number; medianViews: number | null }

/** Mediana de views por dia da semana (horário de São Paulo). Só considera vídeos longos se houver o bastante. */
export function weekdayStats(videos: InsightVideo[]) {
  const longs = videos.filter((v) => !v.is_short && hasViews(v) && v.published_at)
  const base = longs.length >= 8 ? longs : videos.filter((v) => hasViews(v) && v.published_at)
  const stats: WeekdayStat[] = WEEKDAYS.map((day, index) => {
    const list = base.filter((v) => weekdayIndex(new Date(v.published_at!)) === index)
    return { day, index, videos: list.length, medianViews: median(list.map(views)) }
  })
  // Melhor dia: só entre dias com 2+ vídeos (1 vídeo é sorte, não padrão).
  const best = stats.filter((s) => s.videos >= 2 && s.medianViews !== null).sort((a, b) => b.medianViews! - a.medianViews!)[0]
  return { basis: base === longs ? ("longos" as const) : ("todos" as const), stats, best: best ?? null }
}

// ---------------------------------------------------------------------------------------------------------------
// Ritmo de postagem (skill yt-audit: CONSISTÊNCIA, não frequência)

export function uploadRhythm(videos: InsightVideo[], now = new Date()) {
  const dates = videos
    .filter((v) => v.published_at)
    .map((v) => new Date(v.published_at!).getTime())
    .sort((a, b) => b - a)
  const gaps = dates.slice(0, -1).map((d, i) => (d - dates[i + 1]) / DAY_MS)
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const end = now.getTime() - i * 7 * DAY_MS
    const start = end - 7 * DAY_MS
    return { index: 11 - i, uploads: dates.filter((d) => d > start && d <= end).length }
  }).reverse()
  return {
    medianGapDays: median(gaps),
    longestGapDays: gaps.length ? Math.max(...gaps) : null,
    daysSinceLast: dates.length ? Math.floor((now.getTime() - dates[0]) / DAY_MS) : null,
    weeks,
    activeWeeks: weeks.filter((w) => w.uploads > 0).length,
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Títulos como conjunto (skill yt-audit: ler os últimos 10 como a página do canal mostra)

export function titleSet(videos: InsightVideo[], size = 10) {
  const recent = [...videos]
    .filter((v) => v.published_at)
    .sort((a, b) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime())
    .slice(0, size)
  const items = recent.map((v) => ({ id: v.id, title: v.title, lint: lintTitle(v.title), formula: classifyTitle(v.title) }))
  const avg = items.length ? Math.round(items.reduce((s, i) => s + i.lint.score, 0) / items.length) : null
  const issueCount = items
    .flatMap((i) => i.lint.issues.map((x) => x.kind))
    .reduce<Record<string, number>>((acc, k) => ((acc[k] = (acc[k] ?? 0) + 1), acc), {})
  const formulas = new Set(items.map((i) => i.formula.nome))
  return {
    items,
    averageScore: avg,
    commonIssues: Object.entries(issueCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([kind, n]) => ({ kind, n })),
    distinctFormulas: formulas.size,
    sameShape: items.length >= 6 && formulas.size <= 2,
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Engajamento

export function engagement(videos: InsightVideo[]) {
  const base = videos.filter((v) => views(v) > 0)
  const total = base.reduce((s, v) => s + views(v), 0)
  const interactions = base.reduce((s, v) => s + (v.like_count ?? 0) + (v.comment_count ?? 0), 0)
  const shorts = videos.filter((v) => v.is_short).length
  return { rate: total > 0 ? (interactions / total) * 100 : null, shorts, longs: videos.length - shorts }
}

/** Resumo compacto para os prompts (só números já calculados; a IA não inventa métricas). */
export function insightsForPrompt(videos: InsightVideo[]) {
  const o = outliers(videos)
  const w = weekdayStats(videos)
  const r = uploadRhythm(videos)
  const t = titleSet(videos)
  const e = engagement(videos)
  const fmt = (n: number | null, d = 0) => (n === null ? "sem dado" : n.toLocaleString("pt-BR", { maximumFractionDigits: d }))
  const lines = (g: OutlierGroup) =>
    g.enough
      ? g.top.map((x) => `- ${fmt(x.multiple, 1)}× a mediana: "${x.title}" (fórmula: ${x.formula.nome})`).join("\n")
      : `- poucos vídeos (${g.count}) para comparar`
  return [
    `Vídeos analisados: ${videos.length} (${e.longs} longos, ${e.shorts} Shorts).`,
    `Mediana de views: longos ${fmt(o.longos.median)}, Shorts ${fmt(o.shorts.median)}.`,
    `Estouros entre os longos:\n${lines(o.longos)}`,
    `Estouros entre os Shorts:\n${lines(o.shorts)}`,
    `Melhor dia (mediana de views, ${w.basis}): ${w.best ? `${w.best.day} (${w.best.videos} vídeos)` : "sem padrão claro"}.`,
    `Ritmo: mediana de ${fmt(r.medianGapDays, 1)} dias entre uploads; maior intervalo ${fmt(r.longestGapDays, 0)} dias; ${r.activeWeeks} de 12 semanas com upload; último vídeo há ${fmt(r.daysSinceLast)} dias.`,
    `Títulos recentes: nota média ${fmt(t.averageScore)}/100; ${t.distinctFormulas} fórmulas diferentes nos últimos ${t.items.length}${t.sameShape ? " (quase todos com a mesma forma)" : ""}; problemas mais comuns: ${t.commonIssues.map((i) => `${i.kind} (${i.n})`).join(", ") || "nenhum"}.`,
    `Engajamento (likes + comentários por view): ${e.rate === null ? "sem dado" : `${fmt(e.rate, 2)}%`}.`,
  ].join("\n")
}
