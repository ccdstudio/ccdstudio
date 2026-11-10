// Lint de título + texto da thumbnail, portado de references/youtube-agent-skill/skills/yt-package/title.py
// (MIT © 2026 Jake Schincariol) e adaptado para português.
// O par é a unidade: a thumbnail não pode repetir o título.

const DESKTOP = 60
const MOBILE = 40
const HARD = 100

const VAGUE = new Set([
  "incrivel", "insano", "insana", "absurdo", "absurda", "surreal", "definitivo", "definitiva", "melhor", "melhores",
  "perfeito", "perfeita", "segredo", "segredos", "revolucionario", "revolucionaria", "epico", "epica", "completo",
  "completa", "tudo", "poderoso", "poderosa", "chocante", "bizarro", "inacreditavel", "top", "brabo",
])

const STOP = new Set([
  "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas",
  "e", "ou", "para", "pra", "por", "com", "sem", "que", "se", "seu", "sua", "seus", "suas", "voce", "eu", "meu",
  "minha", "isso", "esse", "essa", "este", "esta", "como", "qual", "quais", "porque", "por que", "ao", "aos", "mais",
  "e", "é", "sobre", "ate",
])

export type LintIssue = { kind: string; message: string }
export type TitleLint = { title: string; chars: number; score: number; issues: LintIssue[]; good: string[] }

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
export const words = (s: string) => normalize(s).match(/[a-z0-9]+/g) ?? []
const meaningful = (s: string) => new Set(words(s).filter((w) => !STOP.has(w) && w.length > 1))

export function lintTitle(title: string, thumbText?: string): TitleLint {
  const t = title.trim()
  const n = [...t].length
  const issues: LintIssue[] = []
  const good: string[] = []

  if (n > HARD) issues.push({ kind: "tamanho", message: `${n} caracteres: o limite do YouTube é ${HARD}` })
  else if (n > DESKTOP) issues.push({ kind: "tamanho", message: `${n} caracteres: a busca no computador corta perto de ${DESKTOP}` })
  else good.push(`${n} caracteres, dentro do corte de ${DESKTOP}`)

  if (n > MOBILE) {
    const head = t.slice(0, MOBILE).split(" ").slice(0, -1).join(" ")
    issues.push({ kind: "celular", message: `no celular aparece algo como "${head}…": confira se o assunto aparece` })
  }

  const caps = t.split(/\s+/).filter((w) => w.length > 2 && /\p{L}/u.test(w) && w === w.toLocaleUpperCase("pt-BR"))
  if (caps.length > 2) issues.push({ kind: "caixa alta", message: `${caps.length} palavras em CAIXA ALTA: duas é o limite antes de parecer spam` })
  else if (caps.length) good.push(`${caps.length === 1 ? "1 palavra" : "2 palavras"} em CAIXA ALTA para ênfase`)

  const vague = [...new Set(words(t).filter((w) => VAGUE.has(w)))]
  if (vague.length) issues.push({ kind: "vago", message: `${vague.join(", ")}: troque por um número, nome ou data` })

  const nums = t.match(/\d[\d.,]*%?/g)
  if (nums) good.push(`traz um dado concreto (${nums.slice(0, 3).join(", ")})`)
  else issues.push({ kind: "sem número", message: "sem número, data ou nome: é a correção mais confiável" })

  if (t.endsWith("?")) good.push("pergunta aberta no título")

  const front = words(t).slice(0, 3).filter((w) => !STOP.has(w))
  if (!front.length) issues.push({ kind: "início fraco", message: "as 3 primeiras palavras não dizem o assunto: traga-o para a frente" })

  if (/[—–]/.test(t)) issues.push({ kind: "travessão", message: "tem travessão: troque por vírgula ou ponto" })

  if (thumbText?.trim()) {
    const shared = [...meaningful(t)].filter((w) => meaningful(thumbText).has(w))
    if (shared.length) issues.push({ kind: "repetição", message: `a thumbnail repete o título em "${shared.join(", ")}": ela deve dizer o que o título não diz` })
    else good.push("thumbnail e título usam palavras diferentes")
    const thumbWords = thumbText.trim().split(/\s+/).length
    if (thumbWords > 3) issues.push({ kind: "thumbnail longa", message: `${thumbWords} palavras na thumbnail: três é o limite no tamanho do feed` })
  }

  const score = Math.max(0, Math.min(100, 100 - 14 * issues.length + 4 * good.length))
  return { title: t, chars: n, score, issues, good }
}

/** Ordena os títulos pela nota (estável: empate mantém a ordem da IA). */
export function rankTitles<T extends { titulo: string }>(titles: T[], thumbText?: string) {
  return titles
    .map((item, index) => ({ ...item, index, lint: lintTitle(item.titulo, thumbText) }))
    .sort((a, b) => b.lint.score - a.lint.score || a.index - b.index)
}

/** Teste das 3 buscas: cada busca precisa ter suas palavras no título ou nas 2 primeiras linhas da descrição. */
export function queryTest(queries: string[], title: string, firstLines: string) {
  // Radical simples (5 letras): "calcular" casa com "calculamos", "imposto" com "impostos".
  const stem = (w: string) => w.slice(0, 5)
  const surface = new Set([...meaningful(`${title} ${firstLines}`)].map(stem))
  return queries.map((query) => {
    const terms = [...meaningful(query)]
    const missing = terms.filter((w) => !surface.has(stem(w)))
    return { query, ok: missing.length === 0, missing }
  })
}
