import { z } from "zod"

// Saída da Otimização de vídeo (prompt metadata v2). O schema vai para a OpenAI como saída estruturada;
// as contagens ficam em `isCompleteMetadata` (tolerante) para não reprovar por 1 item a menos.
export const metadataOutputSchema = z.object({
  titulos: z.array(
    z.object({
      titulo: z.string(),
      angulo: z.string(),
    })
  ),
  thumbnail: z.object({
    texto: z.string(),
    briefing: z.string(),
    prompt_com_imagem: z.string(),
    prompt_apenas_texto: z.string(),
  }),
  descricao: z.object({
    primeiras_linhas: z.string(),
    corpo: z.string(),
  }),
  buscas_alvo: z.array(z.string()),
  perguntas_seo: z.array(z.string()),
  tags: z.array(z.string()),
  hashtags: z.array(z.string()),
  cta_final: z.string(),
})

export type MetadataOutput = z.infer<typeof metadataOutputSchema>

export function isCompleteMetadata(o: MetadataOutput) {
  return (
    o.titulos.length >= 5 &&
    o.buscas_alvo.length >= 2 &&
    o.perguntas_seo.length >= 15 &&
    o.tags.length >= 5 &&
    o.hashtags.length >= 3 &&
    o.descricao.primeiras_linhas.trim().length > 0 &&
    o.thumbnail.texto.trim().length > 0 &&
    !JSON.stringify(o).includes("{{")
  )
}

export const metadataInputSchema = z.object({
  assunto: z.string().trim().min(5, "Descreva o assunto do vídeo (mínimo de 5 caracteres)").max(500),
  palavraChave: z.string().trim().min(2, "Informe a palavra-chave principal").max(80),
  objetivo: z.string().trim().min(5, "Diga o objetivo do vídeo (mínimo de 5 caracteres)").max(300),
  nicho: z.string().trim().min(3, "Informe o nicho").max(80),
})

export type MetadataInput = z.infer<typeof metadataInputSchema>
