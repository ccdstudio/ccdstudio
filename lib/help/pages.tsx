import Link from "next/link"
import type { ReactNode } from "react"

// Ajuda de cada página (botão de info no banner → modal com vídeo + "Como funciona"). Público leigo: linguagem simples.
//
// Para adicionar o vídeo de uma página:
//   1. Suba o vídeo no YouTube como "Não listado".
//   2. Cole o link em `video` da página (aceita youtube.com/watch?v=…, youtu.be/…, youtube.com/shorts/…).
// Sem `video`, o modal mostra "Vídeo em breve". Ver docs/AJUDA-E-VIDEOS.md.

export type PageHelp = {
  /** Nome da página no título do modal. */
  title: string
  whatIs: ReactNode
  howToUse: ReactNode
  dataSource: ReactNode
  /** Link do YouTube (não listado). */
  video?: string
}

const link = "font-medium text-primary hover:underline"

export const PAGE_HELP = {
  painel: {
    title: "Painel",
    whatIs: "A página inicial do CCD Studio: um resumo da sua conta e o caminho para as ferramentas.",
    howToUse: "Use o menu à esquerda para abrir as ferramentas. Os seus créditos aparecem no rodapé do menu.",
    dataSource: "Os dados da sua conta no CCD Studio.",
  },
  perfil: {
    title: "Meu perfil",
    whatIs: "Os dados da sua conta: nome, e-mail, senha e o atalho para o seu jeito de falar.",
    howToUse: "Clique em Editar para mudar o nome e em Alterar senha para trocar a senha. Tudo abre numa janelinha.",
    dataSource: "O que você cadastrou aqui. Ninguém além de você (e dos administradores) vê esses dados.",
  },
  usuarios: {
    title: "Usuários",
    whatIs: "A lista de quem tem acesso ao CCD Studio. Só administradores veem esta página.",
    howToUse:
      "Use Novo usuário para dar acesso a alguém. Em cada linha você pode dar ou tirar créditos (com um motivo, que aparece no extrato da pessoa), desativar a conta ou gerar uma senha temporária, que a pessoa troca no primeiro acesso.",
    dataSource: "As contas cadastradas no CCD Studio.",
  },
  planos: {
    title: "Planos e créditos",
    whatIs:
      "O seu saldo de créditos, quanto custa cada ferramenta e o extrato com tudo o que entrou e saiu. Cada geração com IA usa créditos.",
    howToUse:
      "Existem dois tipos: os gratuitos, que voltam ao valor do plano todo dia 1 (o que sobra não acumula), e os comprados, que não expiram. O sistema usa os gratuitos primeiro.",
    dataSource: "O seu saldo e o seu extrato no CCD Studio. Se uma geração der erro, nada é cobrado e nada aparece no extrato.",
  },
  "meu-canal": {
    title: "Meu canal",
    whatIs:
      "Os números públicos do seu canal, do jeito que o YouTube mostra para qualquer pessoa: inscritos, visualizações e os seus vídeos mais recentes.",
    howToUse: (
      <>
        Passe o mouse (ou toque) no <strong>?</strong> ao lado de cada dado para entender o que ele significa. Para saber o que
        fazer com esses números, veja{" "}
        <Link href="/analises/diagnostico" className={link}>
          Análises do canal
        </Link>
        .
      </>
    ),
    dataSource:
      "Buscamos direto no YouTube, sem precisar da sua senha, e guardamos aqui. Tudo se atualiza sozinho a cada 24 horas; o botão Atualizar busca de novo na hora.",
  },
  diagnostico: {
    title: "Diagnóstico do canal",
    whatIs: (
      <>
        Uma leitura do seu canal que termina em <strong>UMA coisa para corrigir primeiro</strong>, 3 coisas que já funcionam
        (para você não estragar) e o que não fazer agora.
      </>
    ),
    howToUse:
      "Clique em Gerar diagnóstico. Leva até 1 minuto. Foque na correção principal durante a semana; os outros itens são para você não mexer no que está dando certo.",
    dataSource:
      "Os títulos, as datas e as views dos seus vídeos recentes (dados públicos do YouTube). A IA também pode olhar as suas miniaturas, se você marcar essa opção.",
  },
  estouros: {
    title: "Vídeos que estouraram",
    whatIs: (
      <>
        Comparamos cada vídeo com o <strong>normal do SEU canal</strong>, não com canais maiores. Um vídeo com{" "}
        <strong>3×</strong> teve 3 vezes as views de um vídeo típico seu.
      </>
    ),
    howToUse:
      "Olhe o que os vídeos do topo têm em comum (o jeito do título, a duração, o dia). Repita o que funcionou. Se quiser, peça à IA 3 ideias de próximos vídeos nesse estilo.",
    dataSource:
      "Os seus 50 vídeos mais recentes, com as views públicas do YouTube. Shorts e vídeos longos são comparados separadamente, porque têm públicos diferentes.",
  },
  ritmo: {
    title: "Melhor dia e ritmo",
    whatIs:
      "Um retrato de como você publica: o intervalo entre vídeos, as semanas em que saiu vídeo e o dia da semana que costuma dar mais views.",
    howToUse:
      "Constância vale mais que quantidade: um vídeo a cada 15 dias, sempre, rende mais que seis numa semana e depois um mês parado. Use o melhor dia como dia fixo de publicação.",
    dataSource:
      "As datas e as views públicas dos seus 50 vídeos mais recentes, no horário de Brasília. Tudo calculado aqui, sem IA e sem gastar créditos.",
  },
  voz: {
    title: "Seu jeito de falar",
    whatIs:
      "Um resumo de como você se comunica: com quem você fala, o seu tom, as palavras que são suas e as que você nunca usa.",
    howToUse: (
      <>
        Clique em <strong>Gerar do canal</strong> (é grátis) e depois revise. Se algo não for a sua cara, clique em{" "}
        <strong>Editar</strong> e ajuste. Daí em diante, toda geração de IA (otimização, roteiro, ideias) usa este perfil.
      </>
    ),
    dataSource:
      "O nome, a descrição, as palavras-chave e os títulos dos vídeos do seu canal no YouTube. A IA só deduz o que está escrito ali; o que não dá para saber fica em branco para você completar.",
  },
  otimizacao: {
    title: "Otimização de vídeo",
    whatIs:
      "Cria tudo o que vai junto com o vídeo na hora de publicar: 10 opções de título com nota, o texto da miniatura, a descrição, as tags e perguntas que as pessoas pesquisam.",
    howToUse:
      "Clique em Nova otimização, diga do que o vídeo fala, a palavra que as pessoas digitariam para achá-lo e o objetivo. Depois copie o que gostar e cole no YouTube. Nada é publicado sozinho.",
    dataSource:
      "O que você escrever, o seu jeito de falar (se tiver criado) e o nome e a descrição do seu canal. O texto é gerado por IA: revise antes de usar.",
  },
  "otimizacao-nova": {
    title: "Nova otimização",
    whatIs: "Um passo a passo de 3 perguntas sobre o seu vídeo. No final, a IA cria títulos, o texto da miniatura, a descrição e as tags.",
    howToUse:
      "Responda uma pergunta por vez e aperte Enter (ou Continuar). Na última tela, confira tudo, ajuste o que quiser com Editar e clique em Gerar. Leva menos de 1 minuto.",
    dataSource:
      "O que você responder, o seu jeito de falar (se tiver criado) e o nome e a descrição do seu canal. Se der algum erro, nenhum crédito é cobrado.",
  },
  "otimizacao-resultado": {
    title: "Resultado da otimização",
    whatIs:
      "As sugestões geradas para o seu vídeo: títulos ordenados pela nota, o texto da miniatura, a descrição pronta, as tags e o teste das 3 buscas.",
    howToUse:
      "Escolha um título (os primeiros têm nota maior) e use o botão Copiar de cada parte para colar no YouTube Studio. Passe o mouse no ? para entender cada nota.",
    dataSource:
      "Gerado por IA a partir do que você informou. As notas dos títulos são calculadas por regras simples, sem IA. Revise antes de publicar.",
  },
  roteiro: {
    title: "Roteiro",
    whatIs:
      "Escreve o texto que você vai falar no vídeo, do começo ao fim: 5 opções de primeira frase (com nota), a explicação de cada parte e o que mostrar na tela em cada momento.",
    howToUse:
      "Clique em Novo roteiro, diga o tema, para quem é e o objetivo. Escolha a primeira frase de que mais gostar, leia tudo em voz alta e ajuste para o seu jeito antes de gravar.",
    dataSource:
      "O que você escrever, o seu jeito de falar (se tiver criado) e os vídeos que mais funcionaram no seu canal. O texto é gerado por IA: revise antes de gravar.",
  },
  "roteiro-novo": {
    title: "Novo roteiro",
    whatIs: "Um passo a passo de 4 perguntas: o tema, para quem é, quanto tempo de vídeo e o que você quer no final. A IA escreve o roteiro inteiro.",
    howToUse:
      "Responda uma pergunta por vez. Na última tela, confira e clique em Gerar. O roteiro leva de 1 a 2 minutos; pode sair da tela que ele fica guardado no Histórico.",
    dataSource:
      "O que você responder, o seu jeito de falar (se tiver criado) e os vídeos que mais funcionaram no seu canal. Se der algum erro, nenhum crédito é cobrado.",
  },
  "roteiro-resultado": {
    title: "Resultado do roteiro",
    whatIs:
      "O roteiro completo: as opções de primeira frase com nota, a virada, cada parte do vídeo com o que mostrar na tela, e a chamada final.",
    howToUse:
      "Escolha a primeira frase (as de nota maior aparecem em destaque), leia o texto em voz alta e use Copiar roteiro para levar ao seu teleprompter ou editor.",
    dataSource:
      "Gerado por IA a partir do tema, do público e do objetivo que você informou. A nota das primeiras frases é calculada por regras simples, sem IA.",
  },
  historico: {
    title: "Histórico",
    whatIs:
      "Cada vez que você usa uma ferramenta com IA (otimização, roteiro, diagnóstico, ideias, perfil de voz), o resultado fica guardado aqui. Nada se perde quando você gera de novo.",
    howToUse:
      "Escolha uma ferramenta nos botões acima da tabela para ver só as gerações dela e clique em Abrir para ver o resultado completo, inclusive os antigos.",
    dataSource:
      "São só as suas gerações: ninguém mais vê esta lista. Se uma geração deu erro, ela não aparece aqui e nenhum crédito foi cobrado.",
  },
  "historico-item": {
    title: "Geração do histórico",
    whatIs: "Uma geração antiga, do jeito que saiu na data em que foi feita.",
    howToUse: "Leia e copie o que quiser. Para gerar uma versão nova, abra a ferramenta pelo menu.",
    dataSource: "O resultado guardado no seu histórico. Só você vê.",
  },
} satisfies Record<string, PageHelp>

export type HelpKey = keyof typeof PAGE_HELP

/** Link do YouTube → endereço de incorporação (sem cookies). Link inválido → null ("Vídeo em breve"). */
export function youtubeEmbedUrl(url?: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^(www\.|m\.)/, "")
    let id: string | null = null
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0]
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v")
      else {
        const m = u.pathname.match(/^\/(shorts|embed|live)\/([^/?]+)/)
        id = m?.[2] ?? null
      }
    }
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null
  } catch {
    return null
  }
}
