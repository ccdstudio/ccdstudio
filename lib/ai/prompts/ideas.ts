import { z } from "zod"
import { FORMULAS } from "@/lib/youtube/formulas"

// Próximas ideias a partir dos estouros do próprio canal (skill yt-viral, MIT © 2026 Jake Schincariol):
// o padrão em comum + as ideias que o criador consegue fazer ESTA SEMANA, na voz dele.
export const IDEAS_PROMPT_VERSION = "1.0.0"

export const ideasOutputSchema = z.object({
  padrao_em_comum: z.string(),
  ideias: z.array(
    z.object({
      titulo: z.string(),
      promessa: z.string(),
      formula: z.string(),
      formato: z.enum(["longo", "short"]),
      por_que: z.string(),
    })
  ),
})

export type IdeasOutput = z.infer<typeof ideasOutputSchema>

export const isCompleteIdeas = (o: IdeasOutput) => o.ideias.length >= 3 && o.padrao_em_comum.trim().length > 0

export const IDEAS_SYSTEM = `Você é um estrategista de YouTube. Recebe os vídeos que mais superaram a mediana do PRÓPRIO canal (estouros) e devolve o padrão em comum e 3 próximas ideias.

REGRAS
- Estouro = views como múltiplo da mediana do próprio canal. Analise o que os estouros têm em comum no TÍTULO (fórmula, assunto, formato). Isso é um julgamento sobre as palavras, não uma prova de por que o vídeo funcionou: diga isso de forma honesta e curta.
- padrao_em_comum: UMA frase com a coisa estrutural que eles compartilham.
- ideias: exatamente 3, que o criador consiga gravar esta semana, com o que ele já tem, no tom dele. Nada de ideia que exija produção cara ou dados que ele não tem.
- titulo: até 60 caracteres, assunto nas primeiras palavras, no máximo 2 palavras em CAIXA ALTA, sem travessão.
- promessa: 1 frase com o que o vídeo entrega.
- formula: use um destes nomes, exatamente: ${FORMULAS.map((f) => f.nome).join(", ")}.
- formato: "longo" ou "short", de acordo com o que estourou no canal.
- por_que: 1 frase ligando a ideia ao padrão dos estouros.
- Nunca invente número, resultado ou fonte.
- Proibido travessão (— ou –) em QUALQUER campo, inclusive em intervalos: escreva "30 a 60 s".
- Escreva em português brasileiro, mantendo nomes próprios e termos técnicos como aparecem no canal.`

export function buildIdeasInput(channelTitle: string, outliersText: string, voice: string) {
  return `CANAL: ${channelTitle}

${outliersText}

${voice}

Dê o padrão em comum e as 3 próximas ideias.`
}
