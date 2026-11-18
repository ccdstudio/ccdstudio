"use client"

import { StepWizard, type WizardStep } from "@/components/ai/step-wizard"
import { THUMBNAIL_STYLES, thumbnailInputSchema } from "@/lib/ai/prompts/thumbnail"
import { generateThumbnail } from "../actions"

const STEPS: WizardStep[] = [
  {
    name: "titulo",
    reviewLabel: "Título do vídeo",
    question: "Qual é o título do vídeo?",
    help: "A capa aparece ao lado do título: ela completa o que o título diz, sem repetir.",
    kind: "text",
    placeholder: "Ex.: Como sair do MEI sem pagar multa",
  },
  {
    name: "assunto",
    reviewLabel: "Do que trata",
    question: "Do que o vídeo trata?",
    help: "Uma ou duas frases. A IA usa isso para escolher a cena e as cores.",
    kind: "textarea",
    placeholder: "Ex.: Passo a passo para dar baixa no MEI e virar ME sem cair em multa da Receita",
  },
  {
    name: "texto_capa",
    reviewLabel: "Texto da capa",
    question: "Quer escolher o texto que vai escrito na capa?",
    help: "Opcional, até 3 palavras. Em branco, a IA sugere um texto que complementa o título.",
    kind: "text",
    placeholder: "Ex.: SEM MULTA",
    format: (v) => v || "a IA sugere",
  },
  {
    name: "estilo",
    reviewLabel: "Estilo",
    question: "Qual estilo de capa?",
    help: "Escolha o que combina com o vídeo. Rosto funciona melhor com a sua foto (próxima pergunta).",
    kind: "choice",
    options: THUMBNAIL_STYLES.map((s) => ({ value: s.value, label: s.label, hint: s.hint })),
    format: (v) => THUMBNAIL_STYLES.find((s) => s.value === v)?.label ?? v,
  },
  {
    name: "foto",
    reviewLabel: "Sua foto",
    question: "Quer aparecer na capa?",
    help: "Opcional. Envie uma foto sua de frente e bem iluminada: a IA usa como referência. A foto vai só para gerar a imagem e não fica guardada.",
    kind: "image",
  },
]

const PHASES = ["Pensando na ideia da capa", "Escrevendo o prompt da imagem", "Desenhando a capa", "Ajustando para 1280×720"]

export function ThumbnailWizard({ cost, blocked }: { cost: string; blocked: string | null }) {
  return (
    <StepWizard
      steps={STEPS}
      initial={{ titulo: "", assunto: "", texto_capa: "", estilo: "rosto", foto: "" }}
      schema={thumbnailInputSchema}
      cost={cost}
      submitLabel="Gerar capa"
      blocked={blocked}
      submit={generateThumbnail}
      phases={PHASES}
      estimatedMs={60_000}
      resultHref={(id) => `/criar/thumbnail/${id}`}
    />
  )
}
