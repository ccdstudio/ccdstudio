import { z } from "zod"
import { interpolatePrompt } from "@/lib/ai/interpolate"
import { lintTitle } from "@/lib/youtube/title-lint"
import { SCRIPT_DURATIONS } from "./script"
import { THUMBNAIL_STYLES, thumbnailInputSchema } from "./thumbnail"

// Vídeo completo — um pedido em texto livre vira o briefing que alimenta Otimização, Roteiro e Thumbnail.
// O briefing não é cobrado; cada parte cobra o próprio custo (FEATURE_COSTS) e grava a própria geração.
// v1.1: o briefing escreve o título final (otimização, roteiro e capa rodam juntos com ele).
export const VIDEO_PROMPT_VERSION = "1.1.0"

export const videoInputSchema = z.object({
  pedido: z
    .string()
    .trim()
    .min(20, "Conte um pouco mais do vídeo (mínimo de 20 caracteres)")
    .max(1500, "Resuma em até 1.500 caracteres"),
  duracao: z.coerce.number().refine((n) => (SCRIPT_DURATIONS as readonly number[]).includes(n), "Escolha uma duração"),
  nicho: z.string().trim().min(3, "Informe o nicho").max(80),
  foto: thumbnailInputSchema.shape.foto,
})
export type VideoInput = z.infer<typeof videoInputSchema>

const STYLE_VALUES = THUMBNAIL_STYLES.map((s) => s.value) as [string, ...string[]]

export const videoBriefingSchema = z.object({
  tema: z.string(),
  publico: z.string(),
  objetivo: z.string(),
  palavra_chave: z.string(),
  titulo: z.string(),
  estilo_capa: z.enum(STYLE_VALUES),
})
export type VideoBriefing = z.infer<typeof videoBriefingSchema>

/** Erros de título que reprovam o briefing (o resto do lint é dica, não bloqueio). */
const BLOCKING = new Set(["caixa alta", "vago", "início fraco", "travessão"])
const titleOk = (t: string) => !lintTitle(t).issues.some((i) => BLOCKING.has(i.kind))

/** Campos dentro dos limites das ferramentas que vão recebê-los (roteiro, otimização e thumbnail). */
export function isCompleteBriefing(b: VideoBriefing) {
  const within = (v: string, min: number, max: number) => v.trim().length >= min && v.trim().length <= max
  return (
    within(b.tema, 10, 500) &&
    within(b.publico, 3, 200) &&
    within(b.objetivo, 5, 300) &&
    within(b.palavra_chave, 2, 80) &&
    within(b.titulo, 5, 70) &&
    titleOk(b.titulo) &&
    !JSON.stringify(b).includes("{{")
  )
}

/** Uma parte do pacote: o id da geração que deu certo, ou a mensagem de erro de quando falhou. */
const partSchema = z.union([z.object({ id: z.string() }), z.object({ erro: z.string() })])
export type VideoPart = z.infer<typeof partSchema>
export const VIDEO_PARTS = ["metadata", "script", "thumbnail"] as const
export type VideoPartKey = (typeof VIDEO_PARTS)[number]

export const videoOutputSchema = z.object({
  // Pacotes da v1.0 guardavam `titulo_provisorio` no briefing; o título do pacote fica em `titulo`.
  briefing: videoBriefingSchema.omit({ titulo: true }).extend({ titulo: z.string().optional() }),
  titulo: z.string(),
  texto_capa: z.string(),
  /** Caminho da imagem da capa no Storage (para a lista não precisar ler a geração da capa). */
  capa_path: z.string().optional(),
  partes: z.object({ metadata: partSchema, script: partSchema, thumbnail: partSchema }),
})
export type VideoOutput = z.infer<typeof videoOutputSchema>

export const videoStoredInputSchema = videoInputSchema.omit({ foto: true }).extend({ usou_foto: z.boolean() })
export type VideoStoredInput = z.infer<typeof videoStoredInputSchema>

const SYSTEM = `Você é produtor de um canal de YouTube do nicho: {{NICHO}}.
O criador descreveu, com as palavras dele, o vídeo que quer gravar. Organize o pedido num briefing curto que vai
alimentar três ferramentas: otimização (título, descrição, SEO), roteiro e thumbnail.

CAMPOS
- tema: o assunto do vídeo em 1 a 3 frases, concreto (o que o vídeo explica, mostra ou resolve). 10 a 500 caracteres.
- publico: para quem é o vídeo, em poucas palavras. Se o pedido não disser, deduza do nicho e do tema.
- objetivo: o que o criador quer que a pessoa faça ou entenda ao final (ex.: agendar uma conversa, entender a regra, se inscrever). Se não disser, deduza algo coerente com o nicho.
- palavra_chave: a busca principal que alguém digitaria no YouTube para achar este vídeo, em minúsculas, 2 a 5 palavras.
- titulo: o título FINAL do vídeo, que a otimização, o roteiro e a capa vão usar. Até 60 caracteres, com o assunto nas 3 primeiras palavras e a palavra_chave (ou variação mínima). No máximo 2 palavras em CAIXA ALTA. Sem adjetivo vazio (incrível, insano, definitivo, segredo): um número, nome ou data concreto vence, mas só se for verdadeiro para o pedido.
- estilo_capa: o estilo de thumbnail que mais combina: ${THUMBNAIL_STYLES.map((s) => `"${s.value}" (${s.hint})`).join(", ")}.{{FOTO}}

REGRAS
- Fiel ao pedido: não troque o assunto nem invente números, leis ou resultados.
- Português brasileiro. Proibido travessão (— ou –).

{{VOZ}}`

const USER = `PEDIDO DO CRIADOR:
{{PEDIDO}}

DURAÇÃO DO VÍDEO: {{DURACAO}} minutos

Monte o briefing.`

export function buildVideoBriefingPrompt(input: Pick<VideoInput, "pedido" | "duracao" | "nicho">, hasPhoto: boolean, voice = "") {
  return {
    system: interpolatePrompt(SYSTEM, {
      NICHO: input.nicho,
      FOTO: hasPhoto ? ' O criador enviou uma foto dele para a capa: prefira "rosto".' : "",
      VOZ: voice,
    }),
    userMessage: interpolatePrompt(USER, { PEDIDO: input.pedido, DURACAO: String(input.duracao) }),
  }
}
