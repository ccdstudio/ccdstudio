import { z } from "zod"
import { interpolatePrompt } from "@/lib/ai/interpolate"
import { SCRIPT_DURATIONS } from "./script"
import { THUMBNAIL_STYLES, thumbnailInputSchema } from "./thumbnail"

// Vídeo completo — um pedido em texto livre vira o briefing que alimenta Otimização, Roteiro e Thumbnail.
// O briefing não é cobrado; cada parte cobra o próprio custo (FEATURE_COSTS) e grava a própria geração.
export const VIDEO_PROMPT_VERSION = "1.0.0"

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
  titulo_provisorio: z.string(),
  estilo_capa: z.enum(STYLE_VALUES),
})
export type VideoBriefing = z.infer<typeof videoBriefingSchema>

/** Campos dentro dos limites das ferramentas que vão recebê-los (roteiro, otimização e thumbnail). */
export function isCompleteBriefing(b: VideoBriefing) {
  const within = (v: string, min: number, max: number) => v.trim().length >= min && v.trim().length <= max
  return (
    within(b.tema, 10, 500) &&
    within(b.publico, 3, 200) &&
    within(b.objetivo, 5, 300) &&
    within(b.palavra_chave, 2, 80) &&
    within(b.titulo_provisorio, 5, 100) &&
    !JSON.stringify(b).includes("{{")
  )
}

/** Uma parte do pacote: o id da geração que deu certo, ou a mensagem de erro de quando falhou. */
const partSchema = z.union([z.object({ id: z.string() }), z.object({ erro: z.string() })])
export type VideoPart = z.infer<typeof partSchema>
export const VIDEO_PARTS = ["metadata", "script", "thumbnail"] as const
export type VideoPartKey = (typeof VIDEO_PARTS)[number]

export const videoOutputSchema = z.object({
  briefing: videoBriefingSchema,
  titulo: z.string(),
  texto_capa: z.string(),
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
- titulo_provisorio: um título de até 60 caracteres, com o assunto nas 3 primeiras palavras. Só será usado se a otimização falhar.
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
