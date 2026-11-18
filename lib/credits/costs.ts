// Custo fixo por geração (docs/SISTEMA-NOVO.md §5.3). Fonte única: checagem, débito e rótulo dos botões.
export const FEATURE_COSTS = {
  metadata: 1,
  script: 1,
  shorts: 1,
  chapters: 1,
  thumbnail: 2,
  /** Perfil de voz: grátis (melhora todas as outras gerações). */
  voice: 0,
  ideas: 1,
  audit: 1,
  plan: 1,
  /** Vídeo completo: o registro do pacote é grátis; cada parte (otimização, roteiro, thumbnail) cobra a sua. */
  video: 0,
} as const

/** Vídeo completo: a soma das partes (otimização + roteiro + thumbnail). */
export const VIDEO_PACKAGE_COST = FEATURE_COSTS.metadata + FEATURE_COSTS.script + FEATURE_COSTS.thumbnail

/** Custo extra do diagnóstico quando analisa as miniaturas por visão. */
export const AUDIT_THUMBNAILS_EXTRA = 1

export type AiFeature = keyof typeof FEATURE_COSTS

export function creditsLabel(amount: number) {
  if (amount === 0) return "grátis"
  return `${amount} ${amount === 1 ? "crédito" : "créditos"}`
}
