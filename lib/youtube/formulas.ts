// As 21 fórmulas de gancho/título da skill yt-script (references/youtube-agent-skill/skills/yt-script/hooks.json,
// MIT © 2026 Jake Schincariol), traduzidas e com padrões de detecção em português.
// A classificação é um julgamento sobre as PALAVRAS do título, não uma explicação de por que o vídeo funcionou.

export type Formula = { id: string; nome: string; forma: string; exemplo: string; match: RegExp[] }

/** Fronteira de palavra que entende acentos (o \b do JS só conhece [A-Za-z0-9_]). */
const B = String.raw`(?:(?<=[\p{L}\d])(?![\p{L}\d])|(?<![\p{L}\d])(?=[\p{L}\d]))`
export const unicodeRegex = (s: string, flags = "iu") => new RegExp(s.replaceAll(String.raw`\b`, B), flags)
const r = (s: string) => unicodeRegex(s)

export const FORMULAS: Formula[] = [
  {
    id: "the-statistic",
    nome: "O Número",
    forma: "Um número que o público não sabia, dito sem rodeio, e a consequência.",
    exemplo: "73% das empresas pagam imposto a mais no Simples",
    match: [r("\\b\\d+([.,]\\d+)?\\s?%"), r("\\b\\d+ (de|em) cada \\d+\\b"), r("\\b\\d{1,3}(\\.\\d{3})+\\b"), r("\\bR\\$\\s?\\d")],
  },
  {
    id: "someone-elses-result",
    nome: "O Resultado de Alguém",
    forma: "O resultado de uma pessoa ou empresa real, depois o mecanismo.",
    exemplo: "Esse cliente saiu de 16% para 6% de imposto",
    match: [r("\\b(esse|este|essa|esta) (cliente|empresa|canal|empres[áa]rio|contador)\\b"), r("\\bsaiu de .* para\\b"), r("\\bem (uma|um|dois|duas|tr[êe]s|\\d+) (semana|m[êe]s|meses|ano)s?\\b")],
  },
  {
    id: "the-mistake",
    nome: "O Erro",
    forma: "Nomeia o erro que o público provavelmente está cometendo agora.",
    exemplo: "O erro no pró-labore que quase todo sócio comete",
    match: [r("\\berros?\\b"), r("\\bvoc[êe] (ainda )?(est[áa]|t[áa]) (fazendo|errando|cometendo)\\b"), r("\\bpare de\\b"), r("\\berrado\\b")],
  },
  {
    id: "contrarian-flip",
    nome: "A Virada Contrária",
    forma: "Afirma o conselho que todo mundo dá e o contradiz.",
    exemplo: "Todo mundo fala para abrir MEI. Não faça isso",
    match: [r("\\btodo mundo (diz|fala|acha|pensa)\\b"), r("\\b(est[áa]|t[áa]) errad[oa]\\b"), r("\\bningu[ée]m (conta|fala|te conta)\\b"), r("\\bmito\\b")],
  },
  {
    id: "the-reveal",
    nome: "A Revelação",
    forma: "Promete mostrar algo específico e mostra.",
    exemplo: "Vou te mostrar a planilha que uso com meus clientes",
    match: [r("\\bvou (te )?mostrar\\b"), r("\\b(aqui|eis) (est[áa]|o|a)\\b"), r("\\bna (sua )?tela\\b"), r("\\bpasso a passo\\b")],
  },
  {
    id: "the-superlative",
    nome: "O Superlativo",
    forma: "O melhor, o pior, o mais rápido ou o único de uma categoria.",
    exemplo: "O jeito mais rápido de sair do Simples",
    match: [r("\\b(o|a) (melhor|pior|[úu]nic[oa])\\b"), r("\\bmais (r[áa]pido|f[áa]cil|barato|simples)\\b"), r("\\bn[úu]mero (1|um)\\b")],
  },
  {
    id: "the-clock",
    nome: "O Relógio",
    forma: "Limita a recompensa no tempo.",
    exemplo: "Calcule o Fator R em 3 minutos",
    match: [r("\\bem (menos de )?\\d+ (segundos|minutos|horas|dias)\\b"), r("\\bat[ée] o final (do|deste) v[íi]deo\\b"), r("\\bem \\d+ passos\\b")],
  },
  {
    id: "i-tried-it",
    nome: "Eu Testei",
    forma: "Experimento em primeira pessoa, com o custo dito.",
    exemplo: "Testei abrir uma holding por 6 meses",
    match: [r("\\b(eu )?(testei|tentei|gastei|fiz|passei)\\b"), r("\\bpor \\d+ (dias|semanas|meses)\\b"), r("\\bpra voc[êe] n[ãa]o (precisar|ter que)\\b")],
  },
  {
    id: "the-question",
    nome: "A Pergunta",
    forma: "A pergunta exata que o público digitou na busca.",
    exemplo: "Vale a pena sair do Simples Nacional?",
    match: [r("^(por que|porque|como|o que|quando|qual|quais|quanto|vale a pena|devo|posso|[ée] poss[íi]vel)\\b"), r("\\?\\s*$")],
  },
  {
    id: "the-before-after",
    nome: "Antes e Depois",
    forma: "Dois estados, com um corte entre eles.",
    exemplo: "Antes pagava 16%, depois do Fator R pago 6%",
    match: [r("\\bantes\\b.*\\bdepois\\b"), r("\\b(eu )?pagava\\b"), r("\\bera assim\\b")],
  },
  {
    id: "the-teardown",
    nome: "A Desmontagem",
    forma: "Desmonta algo real em público.",
    exemplo: "Analisei a DRE de uma empresa que quebrou",
    match: [r("\\b(analisei|analisando|an[áa]lise|desmontei|destrinchei|raio-x)\\b"), r("\\bpor dentro\\b")],
  },
  {
    id: "the-stack",
    nome: "A Combinação",
    forma: "Duas ferramentas citadas, combinadas num resultado.",
    exemplo: "Holding + Lucro Presumido: a combinação que economiza",
    match: [r("\\b\\w+ (\\+|mais) \\w+\\b"), r("\\bcombina(r|ndo|ção)\\b"), r("\\bjunt(o|os|ar)\\b")],
  },
  {
    id: "the-warning",
    nome: "O Alerta",
    forma: "Um custo que o público está prestes a pagar.",
    exemplo: "Não abra sua empresa antes de ver isso",
    match: [r("\\bn[ãa]o (fa[çc]a|abra|assine|pague|declare|mude)\\b"), r("\\bantes de\\b"), r("\\bcuidado\\b"), r("\\baten[çc][ãa]o\\b")],
  },
  {
    id: "the-list",
    nome: "A Lista",
    forma: "Um conjunto contado, com o número logo no começo.",
    exemplo: "5 despesas que você pode deduzir e não sabia",
    match: [r("^\\d+ \\p{L}+"), r("\\b(aqui est[ãa]o|s[ãa]o) \\d+\\b"), r("\\b\\d+ (dicas|erros|passos|formas|jeitos|maneiras|motivos|coisas)\\b")],
  },
  {
    id: "the-receipt",
    nome: "A Prova",
    forma: "Mostra o artefato primeiro e explica depois.",
    exemplo: "Esse é o meu DAS deste mês",
    match: [r("\\b(esse|este|essa|esta) [ée] (o|a) (meu|minha)\\b"), r("\\bprint\\b"), r("\\bprova\\b"), r("\\bcomprovante\\b")],
  },
  {
    id: "the-insider",
    nome: "O Bastidor",
    forma: "Informação de dentro de um sistema.",
    exemplo: "O que a Receita não te conta sobre a malha fina",
    match: [r("\\b(ningu[ée]m|quase ningu[ée]m|poucos) (sabe|conhece|usa|conta)\\b"), r("\\bescondid[oa]\\b"), r("\\bsegredo\\b"), r("\\bn[ãa]o te contam\\b")],
  },
  {
    id: "the-impossible",
    nome: "A Afirmação Impossível",
    forma: "Algo que parece falso, e depois a prova.",
    exemplo: "Como pagar zero de imposto sobre lucro, legalmente",
    match: [r("\\bsem (pagar|gastar|precisar)\\b"), r("\\bnunca\\b"), r("\\bzero\\b"), r("\\blegalmente\\b")],
  },
  {
    id: "the-comparison",
    nome: "A Comparação",
    forma: "Duas opções nomeadas e uma vencedora.",
    exemplo: "MEI ou ME: qual paga menos?",
    match: [r("\\bvs\\.?\\b"), r("\\bversus\\b"), r("\\b\\S+ (ou|x) \\S+\\b.*\\?"), r("\\bqual (compensa|vale|[ée] melhor|paga menos)\\b")],
  },
  {
    id: "the-origin",
    nome: "A Origem",
    forma: "De onde um resultado realmente veio.",
    exemplo: "O verdadeiro motivo do seu imposto ser alto",
    match: [r("\\b(o )?(verdadeiro|real) motivo\\b"), r("\\btudo come[çc]a\\b"), r("\\bde onde vem\\b")],
  },
  {
    id: "the-deadline",
    nome: "O Prazo",
    forma: "Algo está mudando numa data.",
    exemplo: "A reforma tributária muda isso em 2026",
    match: [r("\\b(esta|essa|pr[óo]xima) (semana|m[êe]s|ano)\\b"), r("\\b(vai )?mudar?\\b"), r("\\bprazo\\b"), r("\\bat[ée] (o dia|dia) \\d+\\b"), r("\\b20\\d{2}\\b")],
  },
  {
    id: "the-direct-address",
    nome: "O Recado Direto",
    forma: "Nomeia o público exato nas primeiras seis palavras.",
    exemplo: "Se você é MEI e fatura acima de 60 mil",
    match: [r("^se voc[êe]\\b"), r("\\bpara (quem|voc[êe] que)\\b"), r("\\bvoc[êe] que\\b")],
  },
]

export const NO_FORMULA = { id: "none", nome: "Sem fórmula" } as const

/** Fórmula com mais padrões encontrados no título (empate: a primeira da lista). */
export function classifyTitle(title: string): { id: string; nome: string } {
  let best: Formula | null = null
  let hits = 0
  for (const f of FORMULAS) {
    const n = f.match.filter((re) => re.test(title)).length
    if (n > hits) {
      best = f
      hits = n
    }
  }
  return best ? { id: best.id, nome: best.nome } : NO_FORMULA
}

export function formulaById(id: string) {
  return FORMULAS.find((f) => f.id === id)
}
