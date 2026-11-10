import { z } from "zod"

// Diagnóstico do canal — skill yt-audit (references/youtube-agent-skill, MIT © 2026 Jake Schincariol).
// "Uma auditoria que lista vinte problemas é um jeito de evitar o que importa. Esta termina em UMA correção."
export const AUDIT_PROMPT_VERSION = "1.0.0"

export const auditOutputSchema = z.object({
  correcao_principal: z.object({
    titulo: z.string(),
    por_que: z.string(),
    esta_semana: z.string(),
  }),
  funcionando: z.array(z.string()),
  nao_fazer_agora: z.array(z.object({ o_que: z.string(), por_que: z.string() })),
  miniaturas: z
    .object({
      legiveis_no_feed: z.string(),
      problemas: z.array(z.string()),
    })
    .nullable(),
})

export type AuditOutput = z.infer<typeof auditOutputSchema>

export const isCompleteAudit = (o: AuditOutput, withThumbs: boolean) =>
  o.correcao_principal.titulo.trim().length > 0 &&
  o.funcionando.length >= 2 &&
  o.nao_fazer_agora.length >= 1 &&
  (!withThumbs || o.miniaturas !== null)

export const AUDIT_SYSTEM = `Você audita um canal do YouTube e entrega UMA correção principal. Uma auditoria com vinte problemas é um jeito de evitar o que importa.

O QUE OLHAR, NESTA ORDEM
1. Os últimos 10 títulos como conjunto, como a página do canal mostra: prometem coisas diferentes? Todos têm a mesma forma? Canal com todos os títulos iguais tem problema de formato, não de título.
2. As miniaturas no tamanho do feed (se vierem imagens): o que sobrevive pequeno? Se três ou mais estão ilegíveis no feed, ESSA é a correção e nada mais importa ainda.
3. O ritmo de postagem: CONSISTÊNCIA, não frequência. Seis vídeos numa semana e depois um mês parado é pior que um a cada quinze dias para sempre.
4. Os números já calculados (estouros, melhor dia, engajamento). Use só os números fornecidos. Nunca invente métricas como CTR ou retenção, que você não tem.

O QUE DEVOLVER
- correcao_principal: titulo (a correção, em até 10 palavras), por_que (1 a 2 frases ligadas aos dados) e esta_semana (o que fazer nesta semana, concreto).
- funcionando: exatamente 3 coisas que já funcionam, específicas, para o criador não estragar. "Sua energia é boa" não é uma observação.
- nao_fazer_agora: 1 a 3 itens do que NÃO fazer ainda, com o porquê.
- miniaturas: só se vierem imagens. legiveis_no_feed (1 frase) e problemas (até 3). Sem imagens, devolva null.

REGRAS
- Nunca abra com elogio que você não sustenta. Nunca termine com uma lista de vinte coisas.
- Nunca invente número, resultado ou fonte.
- Português brasileiro, frases curtas, proibido travessão (— ou –) em qualquer campo.`

export function buildAuditInput(channelTitle: string, insights: string, titles: string[], voice: string, withThumbs: boolean) {
  return `CANAL: ${channelTitle}

DADOS CALCULADOS:
${insights}

ÚLTIMOS 10 TÍTULOS (do mais recente para o mais antigo):
${titles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

${withThumbs ? "As imagens anexadas são as miniaturas desses vídeos, na mesma ordem. Avalie como aparecem pequenas no feed." : "Sem miniaturas nesta análise: devolva miniaturas = null."}

${voice}

Faça o diagnóstico.`
}
