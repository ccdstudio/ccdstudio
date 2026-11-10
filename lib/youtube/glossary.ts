// Explicações em linguagem simples (público leigo em tecnologia e em YouTube).
// Fonte única para os "?" (InfoHint) e a ajuda de cada página fica em lib/help/pages.tsx.

export const GLOSSARY = {
  // Dados do canal
  inscritos: "Quantas pessoas seguem o seu canal. Esse número vem direto do YouTube.",
  inscritosOcultos: "O dono do canal escondeu o número de inscritos nas configurações do YouTube.",
  viewsTotais: "Quantas vezes, somando todos os vídeos desde a criação do canal, alguém assistiu.",
  videosPublicados: "Quantos vídeos públicos o canal tem hoje.",
  idadeCanal: "Há quanto tempo o canal existe, contando da data de criação no YouTube.",
  ultimoVideo: "Quantos dias se passaram desde o vídeo mais recente.",
  viewsPorVideo: "Views totais divididas pelo número de vídeos. Mostra quanto, em média, cada vídeo do canal já rendeu.",
  duracaoMedia: "Tempo médio dos vídeos longos recentes (Shorts ficam de fora).",
  mediaViewsRecentes: "Média de views dos vídeos mais recentes que guardamos (até 50).",
  videosPorSemana: "Quantos vídeos, em média, você publicou por semana nos últimos 90 dias.",
  shortsLongos:
    "Short é o vídeo curto e vertical. Aqui contamos como Short todo vídeo de até 3 minutos, porque o YouTube não informa isso diretamente.",
  graficoViews: "Cada barra é um vídeo, na ordem em que foi publicado. Barra mais alta = mais views. Passe o mouse para ver qual é.",
  palavrasChave: "Palavras que o próprio dono do canal cadastrou no YouTube para descrever o canal.",
  likes: "Quantas pessoas clicaram em 'gostei'. Pode aparecer 'Oculto' quando o dono esconde.",
  comentarios: "Quantos comentários o vídeo recebeu. 'Desativados' quando o dono fechou os comentários.",
  atualizacao: "Buscamos os dados públicos no YouTube e guardamos aqui. Eles se atualizam sozinhos a cada 24 horas.",

  // Análises
  mediana:
    "O valor do meio: metade dos seus vídeos teve mais views que isso, metade teve menos. Usamos no lugar da média porque um único vídeo que viralizou não distorce a conta.",
  multiplo:
    "Quantas vezes o vídeo superou o normal do seu canal. 3× quer dizer 3 vezes as views de um vídeo típico seu (a mediana).",
  estouro: "Vídeo que foi muito melhor que o normal do SEU canal (1,5× ou mais), não comparado com canais maiores.",
  formula:
    "O 'jeito' do título: uma pergunta, uma lista, um erro, uma comparação... São 21 formatos conhecidos. É uma leitura das palavras, não a explicação de por que o vídeo foi bem.",
  notaTitulo:
    "Nota de 0 a 100 dada por regras simples: tamanho (até 60 letras), poucas palavras em CAIXA ALTA, um número concreto e não repetir a miniatura.",
  intervalo: "Quantos dias, normalmente, passam entre um vídeo e o próximo.",
  maiorPausa: "O maior tempo que o canal ficou sem publicar, entre os vídeos recentes.",
  semanasComVideo: "Em quantas das últimas 12 semanas saiu pelo menos um vídeo. Constância vale mais que quantidade.",
  melhorDia:
    "O dia da semana em que os seus vídeos costumam ter mais views (pela mediana). Só conta dias com 2 ou mais vídeos, para não ser sorte.",
  engajamento:
    "De cada 100 views, quantas viram curtida ou comentário. Mostra se quem assiste também interage.",
  gancho: "A primeira frase do vídeo (os primeiros 15 segundos). É onde a maioria das pessoas decide se continua assistindo.",
  notaGancho:
    "Nota de 0 a 100 para a primeira frase, olhando se ela é específica, fala com 'você', mostra o que está em jogo, gera curiosidade e cabe em 10 segundos. Nota baixa pede revisão; nota alta não é garantia.",
  buscas: "As 3 frases que alguém digitaria no YouTube para achar este vídeo. O título e o começo da descrição precisam ter essas palavras.",
  tags: "Palavras escondidas que ajudam o YouTube a entender o assunto (grafias, siglas). Pesam pouco: 10 a 15 bastam.",
  creditos: "Cada geração com IA usa créditos do seu saldo. Se a geração falhar, nada é cobrado.",
  creditosGratuitos:
    "Vêm do seu plano e voltam ao valor do plano todo dia 1. O que sobra no fim do mês não acumula. São usados primeiro.",
  creditosComprados:
    "Créditos extras (comprados ou dados pela equipe). Não expiram e só são usados quando os gratuitos acabam.",
  extrato: "Tudo o que entrou e saiu do seu saldo, do mais recente para o mais antigo.",
} as const

export type GlossaryKey = keyof typeof GLOSSARY
