"use client"

import { StepWizard, type WizardStep } from "@/components/ai/step-wizard"
import { metadataInputSchema } from "@/lib/ai/schemas/metadata"
import { generateOptimization } from "../actions"

const STEPS: WizardStep[] = [
  {
    name: "assunto",
    reviewLabel: "Assunto do vídeo",
    question: "Sobre o que é o seu vídeo?",
    help: "Conte em uma ou duas frases, do jeito que você explicaria para um amigo.",
    kind: "textarea",
    placeholder: "Ex.: Como calcular o Fator R no Simples Nacional para pagar menos imposto",
  },
  {
    name: "palavraChave",
    reviewLabel: "Palavra-chave",
    question: "O que as pessoas digitariam no YouTube para achar esse vídeo?",
    help: "Poucas palavras, do jeito que alguém pesquisa. É a palavra que vai no título e no começo da descrição.",
    kind: "text",
    placeholder: "Ex.: fator r",
  },
  {
    name: "objetivo",
    reviewLabel: "Objetivo",
    question: "O que você quer que aconteça depois que a pessoa assistir?",
    help: "Escolha uma sugestão ou escreva com as suas palavras.",
    kind: "textarea",
    placeholder: "Ex.: Gerar contatos de empresários que querem reduzir imposto",
    suggestions: [
      "Gerar contatos de clientes",
      "Ganhar inscritos no canal",
      "Vender um serviço ou curso",
      "Mostrar que eu entendo do assunto",
    ],
  },
]

const PHASES = [
  "Lendo o seu canal e o seu jeito de falar",
  "Escrevendo 10 opções de título",
  "Criando o texto da miniatura",
  "Montando a descrição e as tags",
  "Dando nota aos títulos",
]

export function OptimizationWizard({ niche, cost, blocked }: { niche: string; cost: string; blocked: string | null }) {
  return (
    <StepWizard
      steps={STEPS}
      reviewFields={[{ name: "nicho", label: "Nicho", hint: "O assunto geral do seu canal. Muda o vocabulário do texto." }]}
      initial={{ assunto: "", palavraChave: "", objetivo: "", nicho: niche }}
      schema={metadataInputSchema}
      cost={cost}
      submitLabel="Gerar otimização"
      blocked={blocked}
      submit={generateOptimization}
      phases={PHASES}
      estimatedMs={25_000}
      resultHref={(id) => `/criar/otimizacao/${id}`}
    />
  )
}
