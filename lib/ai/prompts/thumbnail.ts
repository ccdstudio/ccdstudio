import { z } from "zod"
import { interpolatePrompt } from "@/lib/ai/interpolate"
import { words } from "@/lib/youtube/title-lint"

// Thumbnail — regras de capa da skill yt-package (references/youtube-agent-skill, MIT © 2026 Jake Schincariol):
// texto curto (até 3 palavras) que COMPLEMENTA o título em vez de repetir, um ponto focal, contraste alto,
// legível no tamanho do feed. Duas etapas: o modelo de texto escreve a ideia e o prompt; o modelo de imagem desenha.
export const THUMBNAIL_PROMPT_VERSION = "1.0.0"

export const THUMBNAIL_STYLES = [
  { value: "rosto", label: "Rosto + texto", hint: "você em destaque, com expressão, e o texto ao lado" },
  { value: "objeto", label: "Objeto em destaque", hint: "um objeto que resume o assunto, bem grande" },
  { value: "antes-depois", label: "Antes e depois", hint: "a tela dividida mostrando a mudança" },
  { value: "numero", label: "Número grande", hint: "um número ou valor como protagonista" },
] as const

/** Foto do criador: data URL de imagem (reduzida no navegador). Vazia = sem foto. */
const PHOTO = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/
const MAX_PHOTO_CHARS = 2_800_000 // ~2 MB de imagem em base64

export const thumbnailInputSchema = z.object({
  titulo: z.string().trim().min(5, "Escreva o título do vídeo (mínimo de 5 caracteres)").max(100, "O YouTube aceita até 100 caracteres"),
  assunto: z.string().trim().min(10, "Conte um pouco do vídeo (mínimo de 10 caracteres)").max(500),
  texto_capa: z
    .string()
    .trim()
    .max(40, "Texto de capa curto: até 3 palavras")
    .refine((v) => !v || v.split(/\s+/).length <= 3, "Use no máximo 3 palavras"),
  estilo: z.enum(THUMBNAIL_STYLES.map((s) => s.value) as [string, ...string[]], { message: "Escolha um estilo" }),
  foto: z
    .string()
    .max(MAX_PHOTO_CHARS, "Foto grande demais. Use outra imagem.")
    .refine((v) => !v || PHOTO.test(v), "Formato de foto não aceito. Use JPG ou PNG."),
})
export type ThumbnailInput = z.infer<typeof thumbnailInputSchema>

export const thumbnailConceptSchema = z.object({
  texto_capa: z.string(),
  cena: z.string(),
  cores: z.string(),
  composicao: z.string(),
  por_que_clica: z.string(),
  prompt_imagem: z.string(),
})
export type ThumbnailConcept = z.infer<typeof thumbnailConceptSchema>

/** O que fica salvo no histórico: a ideia + onde está a imagem + o que foi usado para gerar. */
export const thumbnailOutputSchema = thumbnailConceptSchema.extend({
  imagem_path: z.string(),
  modelo_imagem: z.string(),
  usou_foto: z.boolean(),
})
export type ThumbnailOutput = z.infer<typeof thumbnailOutputSchema>

/** O pedido salvo (sem a foto, que não é guardada). */
export const thumbnailStoredInputSchema = thumbnailInputSchema.omit({ foto: true }).extend({ usou_foto: z.boolean() })
export type ThumbnailStoredInput = z.infer<typeof thumbnailStoredInputSchema>

/** Até 3 palavras, sem repetir o título (a capa complementa) e com o texto exato dentro do prompt da imagem. */
export function isCompleteConcept(c: ThumbnailConcept, title: string, userText = "") {
  const text = c.texto_capa.trim()
  const textWords = words(text)
  if (!text || textWords.length > 3) return false
  if (userText) {
    // O criador escolheu o texto: vale o dele, exatamente.
    if (text.toLowerCase() !== userText.trim().toLowerCase()) return false
  } else {
    const titleWords = new Set(words(title))
    if (textWords.length > 1 && textWords.every((w) => titleWords.has(w))) return false
  }
  if (!c.prompt_imagem.includes(text)) return false
  return ![c.cena, c.cores, c.composicao, c.prompt_imagem].some((v) => !v.trim() || v.includes("{{"))
}

const SYSTEM = `Você é diretor de arte de thumbnails do YouTube para criadores do nicho: {{NICHO}}.
Você escreve a ideia da capa e o prompt que um gerador de imagens (GPT Image) vai desenhar.

A CAPA É VISTA PEQUENA, NO CELULAR, AO LADO DO TÍTULO
- texto_capa: no máximo 3 palavras, em português, que COMPLEMENTAM o título (dizem o que o título não diz: o resultado, a emoção, o número). Nunca repita o título. Se o criador sugeriu um texto, use exatamente o dele.
- Um único ponto focal. Contraste alto entre o fundo e o texto. Nada de detalhes pequenos que somem no tamanho do feed.
- Estilo pedido: {{ESTILO}}.
- {{FOTO}}

prompt_imagem (em inglês, para o gerador de imagens):
- Descreva a cena, a composição (onde fica o rosto/objeto e onde fica o texto, com área livre para o texto), a iluminação e as cores.
- Formato paisagem 16:9 para thumbnail do YouTube; deixe o assunto principal no centro, com margem nas bordas (a imagem será cortada para 1280x720).
- O texto da capa aparece na imagem EXATAMENTE assim, entre aspas, em letras grandes e grossas, sem outras palavras na imagem: "<texto_capa>".
- Proibido: logos ou marcas de terceiros, pessoas famosas, rostos de outras pessoas reais, texto além do texto da capa, marca d'água.

Os outros campos, em português e curtos (uma frase cada): cena (o que aparece), cores (a paleta e o contraste), composicao (onde fica cada coisa), por_que_clica (por que alguém clicaria, ligado ao título).

REGRAS
- Nunca invente número, resultado ou promessa que o vídeo não sustente. Se não houver número no assunto, não use número.
- Proibido travessão (— ou –) em qualquer campo.

{{VOZ}}`

const USER = `TÍTULO DO VÍDEO: {{TITULO}}
DO QUE O VÍDEO TRATA: {{ASSUNTO}}
TEXTO DA CAPA SUGERIDO PELO CRIADOR: {{TEXTO}}

Escreva a ideia da capa e o prompt da imagem.`

const STYLE_TEXT: Record<string, string> = {
  rosto: "rosto + texto: o criador em destaque, com expressão forte ligada ao assunto, e o texto ao lado",
  objeto: "objeto em destaque: um objeto que resume o assunto, grande e nítido, com o texto ao lado",
  "antes-depois": "antes e depois: a imagem dividida em dois lados mostrando a mudança, com o texto em cima",
  numero: "número grande: um número ou valor do assunto como protagonista visual, enorme",
}

export function buildThumbnailPrompt(input: ThumbnailInput, niche: string, voice: string) {
  return {
    system: interpolatePrompt(SYSTEM, {
      NICHO: niche,
      ESTILO: STYLE_TEXT[input.estilo] ?? input.estilo,
      FOTO: input.foto
        ? "O criador enviou uma foto dele, que será usada como referência: no prompt, diga para manter o rosto, a aparência e a identidade da pessoa da foto de referência, com expressão adequada ao assunto."
        : "Não há foto do criador: não inclua pessoas reais; use objetos, cenários, mãos ou ilustração.",
      VOZ: voice,
    }),
    userMessage: interpolatePrompt(USER, {
      TITULO: input.titulo,
      ASSUNTO: input.assunto,
      TEXTO: input.texto_capa || "nenhum (sugira até 3 palavras)",
    }),
  }
}
