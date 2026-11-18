"use client"

import { StepWizard, type WizardStep } from "@/components/ai/step-wizard"
import { PLAN_HOURS, planInputSchema } from "@/lib/ai/prompts/plan"
import { generatePlan } from "../actions"

const STEPS: WizardStep[] = [
  {
    name: "horas",
    reviewLabel: "Tempo na semana",
    question: "Quanto tempo você tem para o canal nesta semana?",
    help: "Seja honesto: gravar, editar e publicar. Um plano que cabe na sua semana é melhor que um plano bonito.",
    kind: "choice",
    options: PLAN_HOURS.map((h) => ({ value: h.value, label: h.label, hint: h.hint })),
    format: (v) => PLAN_HOURS.find((h) => h.value === v)?.label ?? v,
  },
  {
    name: "assunto",
    reviewLabel: "Assunto do vídeo principal",
    question: "Sobre o que é o vídeo principal da semana?",
    help: "Opcional. Em branco, a IA sugere um assunto no estilo dos vídeos que mais deram certo no seu canal.",
    kind: "textarea",
    placeholder: "Ex.: Como sair do MEI sem pagar multa",
    format: (v) => v || "a IA sugere",
  },
  {
    name: "pronto",
    reviewLabel: "Já está meio pronto",
    question: "Tem algo meio pronto que dá para aproveitar?",
    help: "Opcional. Uma gravação parada, um roteiro, um trecho de live, uma pergunta que o público fez. Vira o vídeo simples da semana.",
    kind: "textarea",
    placeholder: "Ex.: tenho 20 minutos gravados de uma live sobre imposto de renda",
    suggestions: ["Nada ainda", "Um trecho de live", "Um roteiro que não gravei", "Perguntas nos comentários"],
    format: (v) => v || "nada",
  },
  {
    name: "semana",
    reviewLabel: "Semana",
    question: "Para qual semana é o plano?",
    help: "A semana vai de segunda a domingo.",
    kind: "choice",
    options: [
      { value: "atual", label: "Esta semana", hint: "começa nesta segunda" },
      { value: "proxima", label: "Próxima semana", hint: "dá tempo de se preparar" },
    ],
    format: (v) => (v === "proxima" ? "Próxima semana" : "Esta semana"),
  },
]

const PHASES = ["Lendo o ritmo do seu canal", "Escolhendo o dia do vídeo principal", "Separando os 3 Shorts", "Fechando as horas da semana"]

export function PlanWizard({ cost, blocked }: { cost: string; blocked: string | null }) {
  return (
    <StepWizard
      steps={STEPS}
      initial={{ horas: "6", assunto: "", pronto: "", semana: "proxima" }}
      schema={planInputSchema}
      cost={cost}
      submitLabel="Montar a semana"
      blocked={blocked}
      submit={generatePlan}
      phases={PHASES}
      estimatedMs={30_000}
      resultHref={(id) => `/calendario/${id}`}
    />
  )
}
