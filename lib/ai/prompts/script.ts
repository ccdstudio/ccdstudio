import { z } from "zod"
import { interpolatePrompt } from "@/lib/ai/interpolate"
import { FORMULAS } from "@/lib/youtube/formulas"

// Roteiro — revisão do `script-writer` v1.0.0 (docs/PROMPTS.md §2) com a skill yt-script
// (references/youtube-agent-skill, MIT © 2026 Jake Schincariol): 5 ganchos nas 21 fórmulas, virada sem vinheta,
// um assunto por bloco com [NA TELA], entrega explícita e UM pedido no final.
export const SCRIPT_PROMPT_VERSION = "2.0.0"

export const SCRIPT_DURATIONS = [5, 8, 10, 15] as const

export const scriptInputSchema = z.object({
  tema: z.string().trim().min(5, "Descreva o tema do vídeo (mínimo de 5 caracteres)").max(500),
  publico: z.string().trim().min(3, "Para quem é o vídeo?").max(200),
  objetivo: z.string().trim().min(5, "Diga o objetivo do vídeo").max(300),
  duracao: z.coerce.number().refine((n) => (SCRIPT_DURATIONS as readonly number[]).includes(n), "Escolha uma duração"),
  nicho: z.string().trim().min(3, "Informe o nicho").max(80),
})
export type ScriptInput = z.infer<typeof scriptInputSchema>

export const scriptOutputSchema = z.object({
  titulo_sugerido: z.string(),
  ganchos: z.array(z.object({ texto: z.string(), formula: z.string() })),
  virada: z.string(),
  blocos: z.array(z.object({ titulo: z.string(), fala: z.string(), na_tela: z.string() })),
  entrega: z.string(),
  cta: z.string(),
})
export type ScriptOutput = z.infer<typeof scriptOutputSchema>

/** Remove o nome da fórmula se o modelo colocou na frente do gancho ("O Número: ..."). */
export function cleanHook(texto: string, formula: string) {
  const t = texto.trim()
  return t.toLowerCase().startsWith(`${formula.toLowerCase()}:`) ? t.slice(formula.length + 1).trim() : t
}

/** Completo e com pelo menos 70% das palavras da duração alvo (150 por minuto). */
export const isCompleteScript = (o: ScriptOutput, durationMin?: number) =>
  o.ganchos.length >= 3 &&
  o.blocos.length >= 3 &&
  o.blocos.every((b) => b.fala.trim() && b.na_tela.trim()) &&
  !JSON.stringify(o).includes("{{") &&
  (!durationMin || spokenWords(o, o.ganchos[0]?.texto ?? "") >= durationMin * 150 * 0.7)

const isAccounting = (niche: string) => /contab|contador|fiscal|tribut|imposto|finan/i.test(niche)

const ACCOUNTING = `NICHO CONTÁBIL
- Conteúdo técnico real e aplicável à realidade brasileira (Simples, Lucro Presumido/Real, pró-labore, distribuição de lucros, obrigações), com solução prática.
- Nunca chute base legal, alíquota ou prazo. Se um número não for seguro, explique o conceito sem o número.
- O pedido final conversa com quem quer ajuda de um escritório (diagnóstico, simulação, falar com especialista).`

const SYSTEM = `Você escreve roteiros de YouTube que as pessoas assistem até o fim, para criadores do nicho: {{NICHO}}.
O roteiro é FALADO pelo próprio criador. Nunca se apresente, nunca cite IA ou estas regras.

OS PRIMEIROS 15 SEGUNDOS SÃO O TRABALHO TODO
Eles fazem três coisas ou o vídeo vaza: confirmam o clique que o título prometeu, abrem uma pergunta que o público não consegue fechar sozinho e provam que a recompensa existe.

1. ganchos: escreva 5 ganchos diferentes, de 9 a 24 palavras cada (cabem em 10 segundos falados). Cada um usa uma fórmula diferente desta lista: ${FORMULAS.map((f) => f.nome).join(", ")}.
   - texto: SÓ a frase falada, exatamente como o criador vai dizer. Nunca escreva o nome da fórmula dentro do texto.
   - formula: o nome exato da fórmula usada.
   - Fale com "você", traga algo concreto (um caso, um erro, uma consequência) e deixe uma pergunta aberta que só o vídeo responde.
   Priorize as fórmulas que já funcionaram no canal (ver dados), mas sem repetir a mesma em todos.
2. virada (0:15 a 0:45): diga em UMA frase o que o vídeo vai fazer e comece a fazer. Sem vinheta, sem "antes de começar", sem pedir inscrição. Essas são a principal causa da queda aos 30 segundos.
3. blocos: um assunto por bloco, na ordem. Cada bloco tem titulo (curto, para o criador se orientar), fala (o texto falado, completo, natural) e na_tela (o que aparece na tela nesse trecho: tela, gráfico, exemplo, texto). Um rosto falando sem nada para olhar é um podcast.
   TAMANHO É OBRIGATÓRIO: a soma de virada + blocos + entrega + cta precisa chegar perto das PALAVRAS indicadas (150 por minuto da DURAÇÃO ALVO). Escreva de 5 a 8 blocos, e cada fala com 120 a 220 palavras, explicando de verdade, com exemplo. Roteiro curto demais não serve.
4. entrega: entregue explicitamente o que o gancho prometeu e diga que está entregando.
5. cta: UM pedido só, ligado ao OBJETIVO. Não três.

REGRAS
- Nunca invente número, resultado, estatística, lei ou fonte. Se um dado ajudaria e você não tem, escreva sem ele.
- Dados pessoais do criador (nome, empresa, oferta) vão como placeholders entre colchetes: [Seu nome], [Nome da empresa], [Oferta principal].
- Português brasileiro, frases curtas de fala. Proibido travessão (— ou –) em qualquer campo.
- CAIXA ALTA só para destacar no titulo_sugerido (no máximo 2 palavras).

{{REGRAS_NICHO}}

{{CONTEXTO_CANAL}}

{{VOZ}}`

const USER = `TEMA: {{TEMA}}
PÚBLICO: {{PUBLICO}}
OBJETIVO: {{OBJETIVO}}
DURAÇÃO ALVO: {{DURACAO}} minutos (cerca de {{PALAVRAS}} palavras faladas)

Escreva o roteiro.`

export function buildScriptPrompt(input: ScriptInput, channelContext: string, voice: string) {
  return {
    system: interpolatePrompt(SYSTEM, {
      NICHO: input.nicho,
      REGRAS_NICHO: isAccounting(input.nicho) ? ACCOUNTING : "",
      CONTEXTO_CANAL: channelContext,
      VOZ: voice,
    }),
    userMessage: interpolatePrompt(USER, {
      TEMA: input.tema,
      PUBLICO: input.publico,
      OBJETIVO: input.objetivo,
      DURACAO: String(input.duracao),
      PALAVRAS: String(input.duracao * 150),
    }),
  }
}

/** Palavras faladas do roteiro (gancho escolhido + virada + blocos + entrega + cta). */
export function spokenWords(o: ScriptOutput, hook: string) {
  const text = [hook, o.virada, ...o.blocos.map((b) => b.fala), o.entrega, o.cta].join(" ")
  return text.split(/\s+/).filter(Boolean).length
}

type MarkdownOptions = {
  /** Gancho escolhido (o de maior nota). */
  hook: string
  /** Os outros ganchos, com a nota (0–100). */
  alternatives: { texto: string; score: number }[]
  input: ScriptInput
  /** Palavras faladas, para o tempo estimado (150 por minuto). */
  words: number
}

/** Roteiro em Markdown: usado no "Copiar roteiro" e no download (.md). */
export function scriptToMarkdown(o: ScriptOutput, { hook, alternatives, input, words }: MarkdownOptions) {
  const seconds = Math.round((words / 150) * 60)
  const runtime = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
  const meta = [
    `**Tema:** ${input.tema}`,
    `**Para quem:** ${input.publico}`,
    `**Duração alvo:** ${input.duracao} min · **Tempo estimado:** ${runtime} (${words} palavras)`,
  ]
  const lines = [
    `# ${o.titulo_sugerido}`,
    meta.join("  \n"),
    `## Gancho (0:00 a 0:15)\n\n${hook}`,
    `## Virada (0:15 a 0:45)\n\n${o.virada}`,
    ...o.blocos.map((b, i) => `## ${i + 1}. ${b.titulo}\n\n${b.fala}\n\n> **Na tela:** ${b.na_tela}`),
    `## Entrega\n\n${o.entrega}`,
    `## Pedido final\n\n${o.cta}`,
    alternatives.length
      ? `## Outras opções de gancho\n\n${alternatives.map((a) => `- (${a.score}/100) ${a.texto}`).join("\n")}`
      : "",
    "---\n\n_Gerado no CCD Studio. Leia em voz alta e ajuste para a sua fala antes de gravar._",
  ]
  return lines.filter(Boolean).join("\n\n") + "\n"
}

