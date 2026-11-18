import { outliers, type InsightVideo } from "@/lib/youtube/channel-insights"

/**
 * Fórmulas e títulos dos vídeos que estouraram no canal (≥ 1,5× a mediana), para o prompt priorizar o que
 * já funcionou ali. Usado pelo Roteiro e pelo Plano da semana.
 */
export function outlierContext(channelTitle: string, videos: InsightVideo[]) {
  const o = outliers(videos)
  const hits = [...o.longos.top, ...o.shorts.top].filter((v) => v.multiple >= 1.5 && v.formula.id !== "none")
  const formulas = [...new Set(hits.map((v) => v.formula.nome))].slice(0, 4)
  return [
    `DADOS DO CANAL (${channelTitle})`,
    formulas.length ? `Fórmulas dos vídeos que mais superaram a mediana do canal: ${formulas.join(", ")}.` : "",
    hits.length ? `Exemplos de títulos que estouraram: ${hits.slice(0, 3).map((h) => `"${h.title}"`).join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n")
}
