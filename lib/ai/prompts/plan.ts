import { z } from "zod"
import { interpolatePrompt } from "@/lib/ai/interpolate"

// Plano da semana (Calendário editorial) — porta da skill yt-plan
// (references/youtube-agent-skill, MIT © 2026 Jake Schincariol): 1 vídeo principal no melhor dia do canal,
// 1 vídeo simples feito do que já existe e 3 Shorts cortados do principal. Três publicações em sete dias,
// no tamanho das horas que o criador tem. Nada é publicado automaticamente.
export const PLAN_PROMPT_VERSION = "1.0.0"

/** Faixas de horas da semana: valor = teto usado na validação. */
export const PLAN_HOURS = [
  { value: "3", label: "Até 3 horas", hint: "uma semana bem apertada" },
  { value: "6", label: "De 4 a 6 horas", hint: "o mais comum" },
  { value: "10", label: "De 7 a 10 horas", hint: "dá para caprichar no principal" },
  { value: "15", label: "Mais de 10 horas", hint: "semana folgada" },
] as const

/** Dias da semana, de segunda a domingo (mesmos nomes de lib/youtube/channel-insights.ts). */
export const PLAN_DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"] as const
export type PlanDay = (typeof PLAN_DAYS)[number]

export const PLAN_FORMATS = {
  principal: "Principal",
  simples: "Simples",
  short: "Short",
} as const

export const planInputSchema = z.object({
  horas: z.enum(PLAN_HOURS.map((h) => h.value) as [string, ...string[]], { message: "Escolha quanto tempo você tem" }),
  assunto: z.string().trim().max(300, "Resuma em até 300 caracteres"),
  pronto: z.string().trim().max(600, "Resuma em até 600 caracteres"),
  semana: z.enum(["atual", "proxima"], { message: "Escolha a semana" }),
})
export type PlanInput = z.infer<typeof planInputSchema>

/** O pedido como fica salvo: + a segunda-feira da semana e o melhor dia usado (calculados no servidor). */
export const planStoredInputSchema = planInputSchema.extend({
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  melhor_dia: z.string().nullable(),
})

export const planOutputSchema = z.object({
  titulo_principal: z.string(),
  itens: z.array(
    z.object({
      dia: z.enum(PLAN_DAYS),
      formato: z.enum(["principal", "simples", "short"]),
      titulo: z.string(),
      promessa: z.string(),
      ja_existe: z.string(),
      horas: z.number(),
    })
  ),
  horas_total: z.number(),
  por_que_o_dia: z.string(),
  cortar_primeiro: z.string(),
  /** Vazio quando o criador informou o assunto; senão, de onde a IA tirou a sugestão. */
  assunto_sugerido_por: z.string(),
})
export type PlanOutput = z.infer<typeof planOutputSchema>

export const dayIndex = (d: PlanDay) => PLAN_DAYS.indexOf(d)

/**
 * Regras da skill conferidas no código (a saída que falha é gerada de novo, sem cobrar):
 * exatamente 1 principal, 1 simples e 3 Shorts; principal no melhor dia do canal (quando existe);
 * Shorts no dia do principal ou depois; horas dentro da faixa escolhida e batendo com a soma.
 */
export function isCompletePlan(o: PlanOutput, input: PlanInput, bestDay: PlanDay | null) {
  const count = (f: string) => o.itens.filter((i) => i.formato === f).length
  const main = o.itens.find((i) => i.formato === "principal")
  if (!main || count("principal") !== 1 || count("simples") !== 1 || count("short") !== 3) return false
  if (bestDay && main.dia !== bestDay) return false
  if (o.itens.some((i) => i.formato === "short" && dayIndex(i.dia) < dayIndex(main.dia))) return false
  const sum = o.itens.reduce((s, i) => s + i.horas, 0)
  if (o.horas_total > Number(input.horas) || Math.abs(sum - o.horas_total) > 1) return false
  if (o.itens.some((i) => !i.titulo.trim() || !i.promessa.trim())) return false
  return !JSON.stringify(o).includes("{{")
}

const SYSTEM = `Você monta a semana de publicação de um criador do YouTube. Um plano que ele não consegue cumprir é pior que nenhum plano.

A SEMANA TEM EXATAMENTE CINCO ITENS, EM TRÊS DIAS DE PUBLICAÇÃO
1. UM vídeo principal (formato "principal"): o vídeo para o qual a semana existe. Leva a maior parte das horas e sai no DIA DO VÍDEO PRINCIPAL informado. Se nenhum dia for informado, escolha um dia útil e diga em por_que_o_dia que ainda não há dados do canal para escolher.
2. UM vídeo simples (formato "simples"): feito a partir de algo que já existe (um trecho, uma reação, a continuação de um assunto que o público pediu, o que estiver meio pronto). Pouco trabalho. Sai em outro dia.
3. TRÊS Shorts (formato "short") CORTADOS do vídeo principal, não escritos à parte. Saem no dia do principal ou depois dele. Podem dividir o mesmo dia.
Os dias vazios são de propósito: são eles que deixam o plano sobreviver a uma semana ruim. Nunca preencha os sete dias.

HORAS
- O criador tem no máximo {{HORAS}} horas na semana. horas_total nunca passa disso e é a soma das horas de cada item.
- Seja realista: o principal costuma levar mais da metade do tempo; cada Short, menos de meia hora.

ASSUNTO DO PRINCIPAL
- Se o criador informou o assunto, use-o e deixe assunto_sugerido_por vazio.
- Se não informou, proponha um assunto no jeito dos títulos que mais estouraram no canal (ver dados) e explique em assunto_sugerido_por, numa frase, em qual vídeo ou padrão você se baseou. Sem dados do canal, proponha algo do nicho do perfil de voz e diga isso.

CAMPOS
- titulo_principal: o título de trabalho do vídeo principal (igual ao titulo do item principal).
- titulo: título de trabalho, curto, com o assunto nas primeiras palavras.
- promessa: UMA frase com o que a pessoa ganha assistindo.
- ja_existe: o que o criador já tem para esse item (do que ele contou como meio pronto, ou "o próprio vídeo principal" para os Shorts). Se nada existe, escreva "nada ainda".
- cortar_primeiro: se a semana der errado, o que sai primeiro (normalmente o simples, nunca o principal) e por quê, numa frase.
- por_que_o_dia: por que o principal sai nesse dia, citando o dado do canal quando houver.

REGRAS
- Nunca invente número, resultado, estatística ou fonte. Não prometa views.
- Nada é publicado automaticamente: é um plano para o criador decidir.
- Português brasileiro, frases curtas. Proibido travessão (— ou –).

{{CANAL}}

{{VOZ}}`

const USER = `HORAS DISPONÍVEIS NA SEMANA: até {{HORAS}} horas
DIA DO VÍDEO PRINCIPAL: {{DIA}}
ASSUNTO DO VÍDEO PRINCIPAL: {{ASSUNTO}}
O QUE JÁ ESTÁ MEIO PRONTO: {{PRONTO}}

Monte a semana.`

export function buildPlanPrompt(input: PlanInput, channel: string, bestDay: PlanDay | null, voice: string) {
  return {
    system: interpolatePrompt(SYSTEM, { HORAS: input.horas, CANAL: channel, VOZ: voice }),
    userMessage: interpolatePrompt(USER, {
      HORAS: input.horas,
      DIA: bestDay ?? "sem dado do canal (escolha um dia útil)",
      ASSUNTO: input.assunto || "não informado (proponha a partir do que deu certo no canal)",
      PRONTO: input.pronto || "nada",
    }),
  }
}

/* ------------------------------------------------------------------ datas da semana */

const TZ = "America/Sao_Paulo"

/** Segunda-feira (AAAA-MM-DD, horário de Brasília) da semana atual ou da próxima. */
export function weekStart(semana: PlanInput["semana"], now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  )
  const offset = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday)
  const today = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)))
  today.setUTCDate(today.getUTCDate() - offset + (semana === "proxima" ? 7 : 0))
  return today.toISOString().slice(0, 10)
}

/** As 7 datas da semana (segunda a domingo) a partir da segunda AAAA-MM-DD. */
export function weekDates(start: string) {
  const base = new Date(`${start}T12:00:00Z`)
  return PLAN_DAYS.map((day, i) => {
    const d = new Date(base)
    d.setUTCDate(base.getUTCDate() + i)
    return { day, date: d }
  })
}

const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })
export const formatDay = (d: Date) => shortDate.format(d)

const hoursFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })
/** Horas em pt-BR: 3,5 h. */
export const formatHours = (h: number) => `${hoursFmt.format(h)} h`

/* ------------------------------------------------------------------ texto para copiar/baixar */

export function planToMarkdown(o: PlanOutput, start: string) {
  const dates = new Map(weekDates(start).map((w) => [w.day, formatDay(w.date)]))
  const ordered = [...o.itens].sort((a, b) => dayIndex(a.dia) - dayIndex(b.dia))
  return [
    `# Plano da semana · ${dates.get("segunda")} a ${dates.get("domingo")}`,
    `**Vídeo principal:** ${o.titulo_principal}`,
    [
      "| Dia | Formato | Título de trabalho | Promessa | O que já existe | Horas |",
      "|---|---|---|---|---|---|",
      ...ordered.map(
        (i) => `| ${i.dia} (${dates.get(i.dia)}) | ${PLAN_FORMATS[i.formato]} | ${i.titulo} | ${i.promessa} | ${i.ja_existe} | ${formatHours(i.horas)} |`
      ),
    ].join("\n"),
    `**Total:** ${formatHours(o.horas_total)}`,
    `**Por que esse dia:** ${o.por_que_o_dia}`,
    `**Se a semana apertar, corte primeiro:** ${o.cortar_primeiro}`,
    o.assunto_sugerido_por ? `**De onde veio o assunto:** ${o.assunto_sugerido_por}` : "",
    "_Nada é publicado automaticamente. Publica assim ou muda alguma coisa?_",
  ]
    .filter(Boolean)
    .join("\n\n")
}
