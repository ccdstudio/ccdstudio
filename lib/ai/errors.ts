import OpenAI from "openai"

// Erros da camada de IA, com mensagens prontas (pt-BR) para mostrar ao usuário.

export type AiErrorCode = "not_configured" | "insufficient_credits" | "invalid_output" | "rate_limit" | "unavailable" | "image_refused"

export const AI_MESSAGES: Record<AiErrorCode, string> = {
  not_configured: "As ferramentas de IA ainda não foram configuradas. Avise o suporte.",
  insufficient_credits: "Você não tem créditos suficientes para esta geração.",
  invalid_output: "A IA devolveu uma resposta incompleta. Tente novamente; nenhum crédito foi cobrado.",
  rate_limit: "Muitas gerações ao mesmo tempo. Aguarde alguns segundos e tente de novo.",
  unavailable: "A IA não respondeu agora. Tente novamente em instantes; nenhum crédito foi cobrado.",
  image_refused:
    "O gerador de imagens recusou este pedido (regras de conteúdo da OpenAI). Mude o assunto, o texto ou a foto e tente de novo; nenhum crédito foi cobrado.",
}

export class AiError extends Error {
  code: AiErrorCode

  constructor(code: AiErrorCode, message = AI_MESSAGES[code]) {
    super(message)
    this.name = "AiError"
    this.code = code
  }
}

/** Traduz qualquer falha da chamada (SDK, rede, timeout) para um AiError. */
export function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error
  if (error instanceof OpenAI.APIError) {
    if (error.status === 429) return new AiError("rate_limit")
    // Moderação do gerador de imagens.
    if (error.status === 400 && /moderation|safety/i.test(`${error.code ?? ""} ${error.message}`)) return new AiError("image_refused")
    // 401/403: chave inválida; 404: modelo inexistente no OPENAI_MODEL.
    if (error.status === 401 || error.status === 403 || error.status === 404) return new AiError("not_configured")
    return new AiError("unavailable")
  }
  return new AiError("unavailable")
}
