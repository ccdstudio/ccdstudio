"use client"

import { StepWizard, type WizardStep } from "@/components/ai/step-wizard"
import { scriptInputSchema, SCRIPT_DURATIONS } from "@/lib/ai/prompts/script"
import { generateScript } from "../actions"

const STEPS: WizardStep[] = [
  {
    name: "tema",
    reviewLabel: "Tema",
    question: "Qual é o tema do vídeo?",
    help: "Uma frase que resuma o assunto. Quanto mais específico, melhor o roteiro.",
    kind: "textarea",
    placeholder: "Ex.: Pró-labore ou distribuição de lucros: qual paga menos imposto",
  },
  {
    name: "publico",
    reviewLabel: "Para quem é",
    question: "Para quem você está falando?",
    help: "Pense em uma pessoa só: quem é ela e em que situação está.",
    kind: "text",
    placeholder: "Ex.: sócios de pequenas empresas no Simples",
  },
  {
    name: "duracao",
    reviewLabel: "Duração",
    question: "Quanto tempo de vídeo?",
    help: "Calculamos o tamanho do texto pela velocidade normal de fala (150 palavras por minuto).",
    kind: "choice",
    options: SCRIPT_DURATIONS.map((d) => ({
      value: String(d),
      label: `${d} minutos`,
      hint: `cerca de ${d * 150} palavras${d === 8 ? " · o mais usado" : ""}`,
    })),
    format: (v) => `${v} minutos`,
  },
  {
    name: "objetivo",
    reviewLabel: "Objetivo",
    question: "O que você quer que a pessoa faça no final?",
    help: "O roteiro termina com um único pedido. Escolha uma sugestão ou escreva o seu.",
    kind: "textarea",
    placeholder: "Ex.: Gerar contatos de sócios que querem pagar menos imposto",
    suggestions: ["Me chamar no WhatsApp", "Se inscrever no canal", "Assistir o próximo vídeo", "Baixar um material gratuito"],
  },
]

const PHASES = ["Escolhendo os ganchos", "Montando a virada", "Escrevendo cada parte", "Marcando o que vai na tela", "Conferindo o tamanho"]

type Props = {
  niche: string
  cost: string
  blocked: string | null
  prefill: { tema?: string; publico?: string; objetivo?: string }
}

export function ScriptWizard({ niche, cost, blocked, prefill }: Props) {
  const complete = Boolean(prefill.tema && prefill.publico && prefill.objetivo)
  return (
    <StepWizard
      steps={STEPS}
      reviewFields={[{ name: "nicho", label: "Nicho", hint: "O assunto geral do seu canal. Muda o vocabulário do texto." }]}
      initial={{ tema: prefill.tema ?? "", publico: prefill.publico ?? "", objetivo: prefill.objetivo ?? "", duracao: "8", nicho: niche }}
      schema={scriptInputSchema}
      cost={cost}
      submitLabel="Gerar roteiro"
      blocked={blocked}
      startAtReview={complete}
      submit={generateScript}
      phases={PHASES}
      estimatedMs={70_000}
      resultHref={(id) => `/criar/roteiro/${id}`}
    />
  )
}
