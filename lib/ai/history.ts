// Histórico de gerações (/historico): nome de cada ferramenta, resumo de uma linha e onde abrir.
// O resumo sai de campos curtos do input/output (a lista não traz o output inteiro: roteiros são grandes).

/** Campos extraídos no select da lista (caminhos JSON com alias). */
export type HistoryRow = {
  id: string
  feature: string
  created_at: string
  credits_charged: number
  assunto: string | null
  tema: string | null
  canal: string | null
  correcao: string | null
  ideia: string | null
  titulo: string | null
}

export const HISTORY_SELECT =
  "id, feature, created_at, credits_charged, assunto:input->>assunto, tema:input->>tema, canal:input->>canal, " +
  "correcao:output->correcao_principal->>titulo, ideia:output->ideias->0->>titulo, titulo:output->titulos->0->>titulo"

type ToolInfo = {
  label: string
  summary: (r: HistoryRow) => string
  /** Página que mostra a geração. */
  href: (id: string) => string
}

export const HISTORY_TOOLS = {
  metadata: {
    label: "Otimização de vídeo",
    summary: (r) => r.assunto ?? r.titulo ?? "Otimização",
    href: (id) => `/criar/otimizacao/${id}`,
  },
  script: {
    label: "Roteiro",
    summary: (r) => r.tema ?? "Roteiro",
    href: (id) => `/criar/roteiro/${id}`,
  },
  audit: {
    label: "Diagnóstico do canal",
    summary: (r) => r.correcao ?? (r.canal ? `Diagnóstico de ${r.canal}` : "Diagnóstico"),
    href: (id) => `/historico/${id}`,
  },
  ideas: {
    label: "Ideias de vídeos",
    summary: (r) => (r.ideia ? `3 ideias · ${r.ideia}…` : "3 ideias de próximos vídeos"),
    href: (id) => `/historico/${id}`,
  },
  voice: {
    label: "Seu jeito de falar",
    summary: (r) => (r.canal ? `Perfil gerado do canal ${r.canal}` : "Perfil de voz"),
    href: (id) => `/historico/${id}`,
  },
} satisfies Record<string, ToolInfo>

export type HistoryTool = keyof typeof HISTORY_TOOLS

export function isHistoryTool(feature: string | undefined): feature is HistoryTool {
  return !!feature && Object.hasOwn(HISTORY_TOOLS, feature)
}

/** Ferramenta conhecida → info; desconhecida (futura) → nome cru, sem link. */
export function toolInfo(feature: string): ToolInfo | null {
  return isHistoryTool(feature) ? HISTORY_TOOLS[feature] : null
}
