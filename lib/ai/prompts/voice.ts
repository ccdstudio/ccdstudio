import { z } from "zod"

// Perfil de voz — baseado em references/youtube-agent-skill/templates/voice.md (MIT © 2026 Jake Schincariol).
// Deduzido dos textos públicos do canal; o criador revisa e edita no Perfil.
export const VOICE_PROMPT_VERSION = "1.0.0"

export const voiceOutputSchema = z.object({
  nicho: z.string(),
  publico: z.string(),
  tom: z.string(),
  usa: z.array(z.string()),
  evita: z.array(z.string()),
  nao_afirma: z.array(z.string()),
  formato: z.string(),
})

export type VoiceOutput = z.infer<typeof voiceOutputSchema>

export const VOICE_SYSTEM = `Você monta o PERFIL DE VOZ de um criador do YouTube a partir dos textos públicos do canal dele.
O perfil será usado para que roteiros, títulos e descrições soem como ele fala na câmera.

REGRAS
- Deduza SOMENTE do que está nos textos. Se não der para saber, deixe a string vazia ou a lista vazia. Nunca invente.
- Escreva em português brasileiro, frases curtas, sem travessão (— ou –).
- nicho: o assunto do canal em poucas palavras (ex.: "Contabilidade para pequenas empresas").
- publico: UMA pessoa concreta, não "criadores" ou "empresários" genérico. Ex.: "dono de prestadora de serviço no Simples que não entende o próprio imposto". Use só o que os textos indicam.
- tom: como o canal fala (didático, direto, informal, técnico...), em 1 ou 2 frases.
- usa: até 10 termos, expressões ou jeitos de titular que se repetem nos textos e são dele.
- evita: até 10 palavras ou clichês que NÃO combinam com o canal pelo estilo observado (ex.: "game-changer", "incrível", "segredo revelado"). Só inclua se o estilo dos textos justificar.
- nao_afirma: até 6 tipos de promessa que o canal não faz pelo que se vê (ex.: "não promete resultado garantido", "não cita números sem fonte"). Se não houver sinal, deixe vazio.
- formato: 1 ou 2 frases sobre o formato dos vídeos (longos, Shorts, séries, tamanho), só pelo que os títulos e dados mostram.`

export function buildVoiceInput(channel: { title: string; description: string; keywords: string[] }, titles: string[], stats: string) {
  return `CANAL: ${channel.title}

DESCRIÇÃO DO CANAL:
${channel.description.slice(0, 1500) || "(sem descrição)"}

PALAVRAS-CHAVE DO CANAL: ${channel.keywords.join(", ") || "(nenhuma)"}

TÍTULOS DOS VÍDEOS RECENTES:
${titles.map((t) => `- ${t}`).join("\n")}

DADOS: ${stats}

Monte o perfil de voz.`
}
