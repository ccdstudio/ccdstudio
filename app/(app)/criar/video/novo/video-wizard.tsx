"use client"

import { StepWizard, type WizardStep } from "@/components/ai/step-wizard"
import { SCRIPT_DURATIONS } from "@/lib/ai/prompts/script"
import { videoInputSchema } from "@/lib/ai/prompts/video"
import { generateVideoPackage } from "../actions"

const STEPS: WizardStep[] = [
  {
    name: "pedido",
    reviewLabel: "Sobre o vídeo",
    question: "Sobre o que é o vídeo?",
    help: "Escreva do seu jeito: o assunto, para quem é e o que você quer que a pessoa faça no final. A IA monta o resto.",
    kind: "textarea",
    placeholder:
      "Ex.: Quero explicar para donos de pequenas empresas quando vale a pena sair do Simples Nacional, com os erros mais comuns, e chamar para uma conversa com o escritório.",
  },
  {
    name: "duracao",
    reviewLabel: "Duração",
    question: "Quanto tempo de vídeo?",
    help: "O roteiro sai no tamanho certo para essa duração (cerca de 150 palavras por minuto).",
    kind: "choice",
    options: SCRIPT_DURATIONS.map((d) => ({ value: String(d), label: `${d} minutos` })),
    format: (v) => `${v} minutos`,
  },
  {
    name: "foto",
    reviewLabel: "Sua foto",
    question: "Quer aparecer na capa?",
    help: "Opcional. Envie uma foto sua de frente e bem iluminada: a IA usa como referência na thumbnail. A foto vai só para gerar a imagem e não fica guardada.",
    kind: "image",
  },
]

const PHASES = ["Entendendo o vídeo", "Escolhendo título e SEO", "Escrevendo o roteiro", "Desenhando a capa", "Juntando tudo"]

type Props = { niche: string; cost: string; blocked: string | null; prefill?: string }

export function VideoWizard({ niche, cost, blocked, prefill }: Props) {
  return (
    <StepWizard
      steps={STEPS}
      reviewFields={[{ name: "nicho", label: "Nicho", hint: "O assunto geral do seu canal. Muda o vocabulário de tudo." }]}
      initial={{ pedido: prefill ?? "", duracao: "8", foto: "", nicho: niche }}
      schema={videoInputSchema}
      cost={cost}
      submitLabel="Gerar vídeo completo"
      blocked={blocked}
      submit={generateVideoPackage}
      phases={PHASES}
      estimatedMs={150_000}
      resultHref={(id) => `/criar/video/${id}`}
    />
  )
}
