/**
 * Troca cada {{VARIAVEL}} pelo valor. Variável ausente vira string vazia (nunca o placeholder literal),
 * e chaves duplas vindas do usuário são removidas para não virarem placeholders.
 */
export function interpolatePrompt(template: string, values: Record<string, string | undefined | null>) {
  return template.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, key: string) =>
    (values[key] ?? "").replace(/\{\{|\}\}/g, "").trim()
  )
}
