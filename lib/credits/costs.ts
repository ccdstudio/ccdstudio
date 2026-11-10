// Custo fixo por geração (docs/SISTEMA-NOVO.md §5.3). Fonte única: checagem, débito e rótulo dos botões.
export const FEATURE_COSTS = {
  metadata: 1,
  script: 1,
  shorts: 1,
  chapters: 1,
  thumbnail: 2,
} as const

export type AiFeature = keyof typeof FEATURE_COSTS

export function creditsLabel(amount: number) {
  return `${amount} ${amount === 1 ? "crédito" : "créditos"}`
}
