// Nota de gancho (primeiros ~15 s), portada de references/youtube-agent-skill/skills/yt-script/hookscore.py
// (MIT © 2026 Jake Schincariol) com listas em português.
// Aviso da skill: separa ganchos claramente ruins de ganchos reais, mas mal separa os acertos dos erros de um mesmo
// criador. Nota baixa é motivo para revisar; nota alta nunca é promessa.

import { classifyTitle, unicodeRegex } from "./formulas"

const FILLER = new Set([
  "basicamente", "literalmente", "realmente", "muito", "tipo", "ne", "entao", "galera", "pessoal", "fala", "ola",
  "oi", "hoje", "video", "inscreva", "canal", "bem-vindo", "bem-vindos", "aqui",
])
const VAGUE = new Set([
  "incrivel", "insano", "absurdo", "surreal", "segredo", "poderoso", "definitivo", "melhor", "revolucionario",
  "inacreditavel", "chocante", "top", "brabo", "sensacional",
])

const CONCRETE = unicodeRegex(
  String.raw`\b(\d[\d.,]*\s?(%|k|mil|mi|x)?|r\$\s?\d|\d+\s?(segundo|minuto|hora|dia|semana|m[eê]s|meses|ano)s?)\b`,
  "giu"
)
const YOU = unicodeRegex(String.raw`\b(voc[eê]|seu|sua|seus|suas|te|contigo)\b`, "giu")
// Listas adaptadas ao português (as do original são de expressões em inglês).
const STAKE = unicodeRegex(
  String.raw`\b(perde|perder|perdeu|perdendo|pagando|pagar a mais|desperd[ií]|multa|multad|quebra|quebrou|custa|custo|caro|risco|arrisc|perigo|armadilha|antes|pare|parar|nunca|erro|errad|preju[ií]zo|a mais|sem saber|cuidado|fiscaliza|malha fina)\p{L}*`,
  "giu"
)
const CURIOSITY = unicodeRegex(
  String.raw`\b(por que|como|qual|quais|quando|quanto|at[eé]|antes|mas|ningu[eé]m|quase|exceto|motivo|na verdade|segredo|o que|quer saber|descubra|isso|esse|essa|pouca gente|ningu[eé]m te conta)\b`,
  "giu"
)
const CLOSED = unicodeRegex(String.raw`\b(porque|então|o que significa que)\b`)

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const words = (t: string) => normalize(t).match(/[a-z0-9%$.,-]+/g) ?? []
const count = (re: RegExp, t: string) => (t.match(re) ?? []).length
const clamp = (n: number) => Math.max(0, Math.min(100, n))

function specificity(t: string) {
  const w = words(t)
  if (!w.length) return 0
  const nums = count(CONCRETE, t)
  const vague = w.filter((x) => VAGUE.has(x)).length
  const filler = w.filter((x) => FILLER.has(x)).length
  const named = t.split(/\s+/).slice(1).filter((x) => /^\p{Lu}/u.test(x)).length
  return clamp(34 + nums * 22 - vague * 16 - filler * 5 + Math.min(18, 6 * named))
}

function address(t: string) {
  const first = new RegExp(YOU.source, "iu").test(t.split(/\s+/).slice(0, 6).join(" ")) ? 30 : 0
  return clamp(26 + count(YOU, t) * 20 + first)
}

function stakes(t: string) {
  return clamp(22 + count(STAKE, t) * 26 + (new RegExp(CONCRETE.source, "iu").test(t) ? 14 : 0))
}

function curiosity(t: string) {
  const q = t.trim().endsWith("?") ? 18 : 0
  // Gancho que se responde sozinho não deixa curiosidade.
  const closed = CLOSED.test(t) ? -18 : 0
  return clamp(24 + count(CURIOSITY, t) * 17 + q + closed)
}

function brevity(t: string) {
  const n = words(t).length
  if (!n) return 0
  // 9 a 24 palavras: o que cabe em ~10 s falados a 150 palavras por minuto
  if (n >= 9 && n <= 24) return 100
  if (n < 9) return Math.max(30, 100 - (9 - n) * 11)
  return Math.max(10, 100 - (n - 24) * 7)
}

export const HOOK_PROPS = [
  { key: "especificidade", label: "Especificidade", fn: specificity, fix: "troque um adjetivo por um número, nome ou data" },
  { key: "fala_direta", label: "Fala direta", fn: address, fix: "diga \"você\" nas primeiras seis palavras" },
  { key: "risco", label: "O que está em jogo", fn: stakes, fix: "diga quanto custa continuar fazendo do jeito atual" },
  { key: "curiosidade", label: "Curiosidade", fn: curiosity, fix: "corte a metade da frase que já responde a pergunta" },
  { key: "brevidade", label: "Brevidade", fn: brevity, fix: "9 a 24 palavras: leia em voz alta e pare onde faltar fôlego" },
] as const

export type HookBand = "forte" | "ok" | "fraco"
// Faixas recalibradas para a versão em português (o original, em inglês, usa 72/55). Nos testes com ganchos
// reais em pt-BR, frases de enrolação ("fala galera, hoje...") ficam perto de 30 e ganchos de verdade entre 40 e 60.
export const hookBand = (score: number): HookBand => (score >= 58 ? "forte" : score >= 42 ? "ok" : "fraco")

export type HookScore = {
  hook: string
  score: number
  band: HookBand
  /** Propriedade mais fraca e como corrigir. */
  weakest: { label: string; fix: string }
  parts: { key: string; label: string; value: number }[]
  formula: { id: string; nome: string }
}

export function scoreHook(hook: string): HookScore {
  const parts = HOOK_PROPS.map((p) => ({ key: p.key, label: p.label, value: p.fn(hook) }))
  const avg = parts.reduce((s, p) => s + p.value, 0) / parts.length
  // Como no original: a propriedade mais fraca puxa a nota (um gancho forte não pode ter um buraco).
  const low = HOOK_PROPS.reduce((a, b) => (b.fn(hook) < a.fn(hook) ? b : a))
  const score = Math.round(0.6 * avg + 0.4 * Math.min(...parts.map((p) => p.value)))
  return { hook, score, band: hookBand(score), weakest: { label: low.label, fix: low.fix }, parts, formula: classifyTitle(hook) }
}

export function rankHooks(hooks: string[]) {
  return hooks.map(scoreHook).sort((a, b) => b.score - a.score)
}
