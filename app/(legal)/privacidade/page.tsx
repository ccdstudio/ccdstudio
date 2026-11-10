import type { Metadata } from "next"
import Link from "next/link"
import { LegalDocument, type LegalSection } from "@/components/legal/legal-document"
import { env } from "@/lib/env"

export const metadata: Metadata = {
  title: "Política de privacidade · CCD Studio",
  description: "Como o CCD Studio coleta, usa, guarda e protege os seus dados.",
}

// Versão inicial, baseada nas funções atuais do app. Revisar quando o app estiver pronto
// (novas ferramentas, planos/pagamentos, hospedagem definitiva) e com apoio jurídico.
const UPDATED_AT = "10 de novembro de 2026"

export default function PrivacyPage() {
  const email = env.SUPPORT_EMAIL
  const mail = <a href={`mailto:${email}`}>{email}</a>

  const sections: LegalSection[] = [
    {
      id: "quem-somos",
      title: "Quem somos",
      content: (
        <p>
          O CCD Studio é uma plataforma da <strong>AM Educação</strong> com ferramentas de inteligência artificial para
          criadores de conteúdo do YouTube. A AM Educação é a controladora dos dados pessoais tratados no CCD Studio, nos
          termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018, “LGPD”).
        </p>
      ),
    },
    {
      id: "dados-coletados",
      title: "Quais dados coletamos",
      content: (
        <>
          <p>Coletamos apenas o necessário para o funcionamento do serviço:</p>
          <ul>
            <li>
              <strong>Dados da conta:</strong> nome, e-mail, tipo de conta (usuário, administrador) e status. As contas
              são criadas por um administrador do CCD Studio.
            </li>
            <li>
              <strong>Senha:</strong> guardada apenas de forma criptografada (hash); ninguém da equipe tem acesso a ela.
            </li>
            <li>
              <strong>Login com o Google:</strong> se você optar por entrar com o Google, recebemos do Google o seu nome,
              e-mail, foto de perfil e um identificador da conta Google. Não recebemos a sua senha do Google.
            </li>
            <li>
              <strong>Canal do YouTube:</strong> quando você informa o seu canal, consultamos os dados <em>públicos</em>{" "}
              dele (nome, @handle, foto, descrição, país, data de criação e números de inscritos, visualizações e
              vídeos) pela API do YouTube.
            </li>
            <li>
              <strong>Conteúdo que você envia às ferramentas:</strong> textos, temas, roteiros, transcrições e outras
              informações que você digitar ou enviar para gerar conteúdo, e os resultados gerados.
            </li>
            <li>
              <strong>Dados técnicos:</strong> cookies de sessão para manter você conectado, registros de acesso e de
              erros (data, hora, endereço IP e navegador), usados para segurança e suporte.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "uso-dos-dados",
      title: "Para que usamos os dados",
      content: (
        <ul>
          <li>Criar e manter a sua conta, autenticar o seu acesso e proteger a plataforma contra uso indevido.</li>
          <li>Exibir os dados do seu canal e personalizar as ferramentas (roteiros, títulos, descrições, thumbnails).</li>
          <li>Gerar conteúdo com inteligência artificial a partir do que você solicitar.</li>
          <li>Prestar suporte, responder solicitações e comunicar mudanças importantes no serviço.</li>
          <li>Cumprir obrigações legais e regulatórias.</li>
        </ul>
      ),
    },
    {
      id: "bases-legais",
      title: "Bases legais (LGPD)",
      content: (
        <ul>
          <li>
            <strong>Execução de contrato</strong> (art. 7º, V): para prestar o serviço que você contratou ou utiliza.
          </li>
          <li>
            <strong>Legítimo interesse</strong> (art. 7º, IX): segurança, prevenção a fraudes e melhoria do serviço.
          </li>
          <li>
            <strong>Consentimento</strong> (art. 7º, I): login com o Google e vínculo do canal do YouTube, que você pode
            remover a qualquer momento.
          </li>
          <li>
            <strong>Cumprimento de obrigação legal</strong> (art. 7º, II): guarda de registros de acesso exigida pelo
            Marco Civil da Internet.
          </li>
        </ul>
      ),
    },
    {
      id: "youtube",
      title: "Dados do YouTube (YouTube API Services)",
      content: (
        <>
          <p>
            O CCD Studio usa os <strong>YouTube API Services</strong> para consultar dados públicos do canal que você
            informa. Ao usar esse recurso, você também concorda com os{" "}
            <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">
              Termos de Serviço do YouTube
            </a>
            , e os dados obtidos estão sujeitos à{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Política de Privacidade do Google
            </a>
            .
          </p>
          <ul>
            <li>Os dados do canal ficam guardados temporariamente e são atualizados ou apagados em até 30 dias.</li>
            <li>
              Ao remover ou trocar o canal no seu Perfil, os dados guardados daquele canal são apagados quando nenhum
              outro usuário o utiliza.
            </li>
            <li>Não vendemos nem compartilhamos dados do YouTube com terceiros.</li>
            <li>
              Se você entrou com o Google, pode revogar o acesso do CCD Studio à sua conta Google a qualquer momento em{" "}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
                myaccount.google.com/permissions
              </a>
              .
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "compartilhamento",
      title: "Com quem compartilhamos",
      content: (
        <>
          <p>
            Não vendemos dados pessoais. Compartilhamos dados apenas com fornecedores que operam partes do serviço em
            nosso nome, sob contrato e na medida necessária:
          </p>
          <ul>
            <li>
              <strong>Supabase:</strong> banco de dados e autenticação (armazenamento da conta e da sessão).
            </li>
            <li>
              <strong>Google:</strong> login com o Google e consulta à API do YouTube.
            </li>
            <li>
              <strong>OpenAI:</strong> processamento por inteligência artificial do conteúdo que você envia às
              ferramentas, para gerar os resultados solicitados.
            </li>
            <li>
              <strong>Provedor de hospedagem</strong> da aplicação e serviços de registro de erros.
            </li>
          </ul>
          <p>
            Também podemos compartilhar dados quando exigido por lei, ordem judicial ou autoridade competente. Alguns
            desses fornecedores podem processar dados fora do Brasil; nesses casos, adotamos as garantias previstas na
            LGPD para a transferência internacional.
          </p>
        </>
      ),
    },
    {
      id: "armazenamento",
      title: "Por quanto tempo guardamos",
      content: (
        <ul>
          <li>Dados da conta: enquanto a conta existir. Após a exclusão, são removidos ou anonimizados.</li>
          <li>Dados do canal do YouTube: no máximo 30 dias sem atualização, ou até você remover o canal.</li>
          <li>Conteúdo gerado: enquanto a conta existir ou até você apagá-lo.</li>
          <li>Registros de acesso: pelo menos 6 meses, conforme o Marco Civil da Internet.</li>
        </ul>
      ),
    },
    {
      id: "seguranca",
      title: "Segurança",
      content: (
        <p>
          Usamos conexão criptografada (HTTPS), senhas com hash, controle de acesso por tipo de conta e isolamento dos
          dados por usuário no banco de dados. Nenhum sistema é totalmente imune a incidentes; se ocorrer um incidente
          que possa causar risco relevante, avisaremos os titulares afetados e a ANPD, conforme a LGPD.
        </p>
      ),
    },
    {
      id: "cookies",
      title: "Cookies",
      content: (
        <p>
          Usamos apenas cookies <strong>essenciais</strong>, para manter a sua sessão e a segurança do login, e o
          armazenamento local do navegador para lembrar preferências como o tema claro ou escuro. Não usamos cookies de
          publicidade.
        </p>
      ),
    },
    {
      id: "direitos",
      title: "Seus direitos",
      content: (
        <>
          <p>Pela LGPD, você pode, a qualquer momento:</p>
          <ul>
            <li>confirmar se tratamos seus dados e acessá-los;</li>
            <li>corrigir dados incompletos, inexatos ou desatualizados (o nome pode ser alterado no seu Perfil);</li>
            <li>pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários;</li>
            <li>pedir a portabilidade e informações sobre com quem compartilhamos os dados;</li>
            <li>revogar o consentimento (por exemplo, remover o canal do YouTube ou o acesso do Google);</li>
            <li>pedir a exclusão da sua conta.</li>
          </ul>
          <p>Para exercer esses direitos, escreva para {mail}. Respondemos em até 15 dias.</p>
        </>
      ),
    },
    {
      id: "criancas",
      title: "Menores de idade",
      content: (
        <p>
          O CCD Studio é destinado a maiores de 18 anos. Não coletamos intencionalmente dados de crianças e adolescentes.
        </p>
      ),
    },
    {
      id: "alteracoes",
      title: "Alterações desta política",
      content: (
        <p>
          Podemos atualizar esta política para refletir mudanças no serviço ou na lei. A data da última atualização fica
          no topo da página; mudanças relevantes serão comunicadas no app ou por e-mail.
        </p>
      ),
    },
    {
      id: "contato",
      title: "Contato",
      content: (
        <p>
          Dúvidas sobre privacidade ou sobre esta política: {mail}. Veja também os{" "}
          <Link href="/termos">Termos de uso</Link>.
        </p>
      ),
    },
  ]

  return (
    <LegalDocument
      eyebrow="Privacidade"
      title="Política de privacidade"
      updatedAt={UPDATED_AT}
      intro={
        <p>
          Esta política explica, de forma direta, quais dados o CCD Studio coleta, para que usa, com quem compartilha e
          como você controla as suas informações.
        </p>
      }
      sections={sections}
    />
  )
}
