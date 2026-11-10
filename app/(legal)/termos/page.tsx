import type { Metadata } from "next"
import Link from "next/link"
import { LegalDocument, type LegalSection } from "@/components/legal/legal-document"
import { env } from "@/lib/env"

export const metadata: Metadata = {
  title: "Termos de uso · CCD Studio",
  description: "Regras de uso da plataforma CCD Studio.",
}

// Versão inicial, baseada nas funções atuais do app. Revisar quando o app estiver pronto
// (planos, créditos e pagamentos) e com apoio jurídico.
const UPDATED_AT = "10 de novembro de 2026"

export default function TermsPage() {
  const email = env.SUPPORT_EMAIL
  const mail = <a href={`mailto:${email}`}>{email}</a>

  const sections: LegalSection[] = [
    {
      id: "aceite",
      title: "Aceite",
      content: (
        <p>
          Estes termos regulam o uso do CCD Studio, plataforma da <strong>AM Educação</strong>. Ao acessar ou usar o
          serviço, você concorda com estes termos e com a <Link href="/privacidade">Política de privacidade</Link>. Se
          não concordar, não use o serviço.
        </p>
      ),
    },
    {
      id: "servico",
      title: "O serviço",
      content: (
        <p>
          O CCD Studio oferece ferramentas de inteligência artificial para criadores de conteúdo do YouTube, como apoio
          na criação de roteiros, títulos, descrições, tags, thumbnails, cortes e capítulos, além da exibição de dados
          públicos do seu canal. As funcionalidades podem ser incluídas, alteradas ou descontinuadas ao longo do tempo.
        </p>
      ),
    },
    {
      id: "conta",
      title: "Conta e acesso",
      content: (
        <ul>
          <li>As contas são criadas por um administrador do CCD Studio; não há cadastro público.</li>
          <li>O acesso é pessoal e intransferível. Você é responsável por manter a sua senha em sigilo.</li>
          <li>
            Você pode entrar com e-mail e senha ou com a sua conta Google, desde que use o mesmo e-mail cadastrado.
          </li>
          <li>
            Ao receber uma senha temporária, troque-a por uma senha pessoal. Avise o suporte imediatamente se suspeitar
            de uso indevido da sua conta.
          </li>
          <li>O serviço é destinado a maiores de 18 anos.</li>
        </ul>
      ),
    },
    {
      id: "uso-permitido",
      title: "Uso permitido",
      content: (
        <>
          <p>Ao usar o CCD Studio, você se compromete a não:</p>
          <ul>
            <li>violar leis, direitos de terceiros (inclusive direitos autorais e de imagem) ou estes termos;</li>
            <li>gerar ou publicar conteúdo ilegal, discriminatório, enganoso, difamatório ou que incentive violência;</li>
            <li>tentar acessar dados de outros usuários, contornar limites de uso ou comprometer a segurança do sistema;</li>
            <li>usar robôs, scripts ou acesso automatizado não autorizado;</li>
            <li>revender ou disponibilizar o acesso a terceiros sem autorização.</li>
          </ul>
        </>
      ),
    },
    {
      id: "conteudo-ia",
      title: "Conteúdo gerado por IA",
      content: (
        <ul>
          <li>
            Os resultados são gerados por inteligência artificial e podem conter erros, imprecisões ou semelhanças com
            conteúdos existentes. <strong>Revise tudo antes de publicar.</strong>
          </li>
          <li>Nada é publicado automaticamente: a decisão e a publicação no YouTube são sempre suas.</li>
          <li>
            Você é responsável pelo que publica e por garantir que o conteúdo respeita as leis e as políticas do YouTube.
          </li>
          <li>
            Respeitado o uso permitido, o conteúdo que você envia e os resultados gerados para você são seus para usar,
            inclusive comercialmente.
          </li>
        </ul>
      ),
    },
    {
      id: "youtube",
      title: "YouTube e Google",
      content: (
        <p>
          Os recursos que usam dados do YouTube dependem dos YouTube API Services. Ao utilizá-los, você concorda com os{" "}
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">
            Termos de Serviço do YouTube
          </a>{" "}
          e com a{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Política de Privacidade do Google
          </a>
          . O CCD Studio não é afiliado, patrocinado ou endossado pelo YouTube ou pelo Google.
        </p>
      ),
    },
    {
      id: "planos",
      title: "Planos e créditos",
      content: (
        <p>
          Algumas ferramentas poderão consumir créditos ou depender de um plano. As condições de cada plano (preço,
          créditos incluídos, validade, renovação e cancelamento) serão informadas antes da contratação e passarão a fazer
          parte destes termos.
        </p>
      ),
    },
    {
      id: "propriedade",
      title: "Propriedade intelectual",
      content: (
        <p>
          A marca CCD Studio, o software, o design e os materiais da plataforma pertencem à AM Educação. Estes termos não
          transferem a você nenhum direito sobre eles, além do uso do serviço conforme aqui descrito.
        </p>
      ),
    },
    {
      id: "suspensao",
      title: "Suspensão e encerramento",
      content: (
        <p>
          Podemos suspender ou desativar contas que violem estes termos ou coloquem o serviço em risco. Você pode pedir o
          encerramento da sua conta a qualquer momento pelo e-mail {mail}; os dados serão tratados conforme a{" "}
          <Link href="/privacidade">Política de privacidade</Link>.
        </p>
      ),
    },
    {
      id: "responsabilidade",
      title: "Disponibilidade e responsabilidade",
      content: (
        <ul>
          <li>
            Trabalhamos para manter o serviço disponível, mas podem ocorrer interrupções para manutenção ou por falhas de
            fornecedores (como Google, YouTube e provedores de IA).
          </li>
          <li>
            O CCD Studio não garante resultados de audiência, visualizações, inscritos ou receita a partir do uso das
            ferramentas.
          </li>
          <li>
            Na máxima extensão permitida pela lei, a AM Educação não se responsabiliza por danos indiretos decorrentes do
            uso do serviço ou de conteúdo publicado pelo usuário.
          </li>
        </ul>
      ),
    },
    {
      id: "alteracoes",
      title: "Alterações destes termos",
      content: (
        <p>
          Podemos atualizar estes termos. A data da última atualização fica no topo da página; mudanças relevantes serão
          comunicadas no app ou por e-mail. Continuar usando o serviço após a mudança significa aceitar a nova versão.
        </p>
      ),
    },
    {
      id: "lei",
      title: "Lei aplicável e contato",
      content: (
        <p>
          Estes termos seguem as leis da República Federativa do Brasil, incluindo o Código de Defesa do Consumidor quando
          aplicável. Dúvidas ou solicitações: {mail}.
        </p>
      ),
    },
  ]

  return (
    <LegalDocument
      eyebrow="Termos"
      title="Termos de uso"
      updatedAt={UPDATED_AT}
      intro={<p>Leia com atenção: estes termos explicam o que você pode esperar do CCD Studio e o que esperamos de você.</p>}
      sections={sections}
    />
  )
}
