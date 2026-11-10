"use client"

import { useActionState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SparklesIcon } from "@hugeicons/core-free-icons"
import { FormMessage, TextAreaField, TextField } from "@/components/forms/form-field"
import { SubmitButton } from "@/components/forms/submit-button"
import { FormDialog } from "@/components/shared/form-dialog"
import { Button } from "@/components/ui/button"
import type { FormState } from "@/lib/auth/schemas"
import { generateMetadata } from "./actions"

type Props = { cost: string; defaultNiche: string; disabled?: boolean; label?: string }

function OptimizationForm({ cost, defaultNiche, close }: Props & { close: () => void }) {
  // Sucesso redireciona para o resultado; aqui só tratamos erros.
  const [state, action, pending] = useActionState<FormState, FormData>(generateMetadata, {})

  return (
    <form action={action} noValidate className="grid gap-4">
      <TextAreaField
        name="assunto"
        label="Assunto do vídeo"
        required
        autoFocus
        rows={3}
        placeholder="Ex.: Como calcular o Fator R no Simples Nacional para pagar menos imposto"
        errors={state.fieldErrors?.assunto}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="palavraChave"
          label="Palavra-chave principal"
          required
          placeholder="Ex.: fator r"
          hint="O termo que as pessoas digitam na busca."
          errors={state.fieldErrors?.palavraChave}
        />
        <TextField
          name="nicho"
          label="Nicho"
          required
          defaultValue={defaultNiche}
          hint="Muda o vocabulário e as regras do texto."
          errors={state.fieldErrors?.nicho}
        />
      </div>
      <TextAreaField
        name="objetivo"
        label="Objetivo do vídeo"
        required
        rows={2}
        placeholder="Ex.: Gerar contatos de empresários que querem reduzir imposto"
        errors={state.fieldErrors?.objetivo}
      />
      <FormMessage message={state.message} />
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="ghost" onClick={close} disabled={pending}>
          Cancelar
        </Button>
        <SubmitButton pending={pending} pendingLabel="Gerando… (até 1 min)">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={1.75} data-icon="inline-start" />
          Gerar · {cost}
        </SubmitButton>
      </div>
    </form>
  )
}

export function NewOptimizationDialog({ cost, defaultNiche, disabled, label = "Nova otimização" }: Props) {
  return (
    <FormDialog
      title="Nova otimização de vídeo"
      description="Títulos, thumbnail, descrição, tags e perguntas de busca para o seu vídeo. Nada é publicado automaticamente."
      className="sm:max-w-2xl"
      trigger={
        <Button disabled={disabled}>
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={1.75} data-icon="inline-start" />
          {label}
        </Button>
      }
    >
      {(close) => <OptimizationForm cost={cost} defaultNiche={defaultNiche} close={close} />}
    </FormDialog>
  )
}
