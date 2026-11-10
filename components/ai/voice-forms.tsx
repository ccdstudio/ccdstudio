"use client"

import { useActionState, useTransition } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit02Icon, Loading03Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { FormMessage, TextAreaField, TextField } from "@/components/forms/form-field"
import { SubmitButton } from "@/components/forms/submit-button"
import { FormDialog } from "@/components/shared/form-dialog"
import { DialogActions, useOnSuccess } from "@/components/shared/form-helpers"
import { Button } from "@/components/ui/button"
import type { FormState } from "@/lib/auth/schemas"
import { generateVoiceProfile, saveVoiceProfile } from "@/lib/ai/voice-actions"

export type VoiceValues = {
  niche: string
  audience: string
  tone: string
  uses: string[]
  avoids: string[]
  wont_claim: string[]
  format: string
}

/** Gera (ou regera) o perfil a partir do canal. Grátis. */
export function GenerateVoiceButton({ hasProfile, disabled }: { hasProfile: boolean; disabled?: boolean }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant={hasProfile ? "ghost" : "default"}
      size="sm"
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          const r = await generateVoiceProfile()
          if (r.ok) toast.success(r.message)
          else toast.error(r.message ?? "Algo deu errado.")
        })
      }
    >
      <HugeiconsIcon
        icon={pending ? Loading03Icon : SparklesIcon}
        strokeWidth={1.75}
        className={pending ? "animate-spin" : undefined}
        data-icon="inline-start"
      />
      {pending ? "Lendo o canal…" : hasProfile ? "Gerar de novo" : "Gerar do canal · grátis"}
    </Button>
  )
}

function VoiceForm({ values, close }: { values?: VoiceValues; close: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveVoiceProfile, {})
  useOnSuccess(state, close)
  const join = (xs?: string[]) => (xs ?? []).join("\n")

  return (
    <form action={action} noValidate className="grid gap-4 sm:grid-cols-2">
      <TextField
        name="niche"
        label="Nicho"
        required
        autoFocus
        defaultValue={values?.niche}
        placeholder="Ex.: Contabilidade para pequenas empresas"
        errors={state.fieldErrors?.niche}
        fieldClassName="sm:col-span-2"
      />
      <TextAreaField
        name="audience"
        label="Com quem você fala"
        rows={2}
        defaultValue={values?.audience}
        hint="Uma pessoa concreta, não um público genérico."
        fieldClassName="sm:col-span-2"
      />
      <TextAreaField name="tone" label="Tom" rows={2} defaultValue={values?.tone} fieldClassName="sm:col-span-2" />
      <TextAreaField name="uses" label="Termos que são seus" rows={4} defaultValue={join(values?.uses)} hint="Um por linha." />
      <TextAreaField name="avoids" label="Palavras que você nunca usa" rows={4} defaultValue={join(values?.avoids)} hint="Um por linha." />
      <TextAreaField
        name="wont_claim"
        label="O que você não afirma nem promete"
        rows={3}
        defaultValue={join(values?.wont_claim)}
        hint="Um por linha. A IA vai recusar isso por você."
        fieldClassName="sm:col-span-2"
      />
      <TextAreaField name="format" label="Formato dos vídeos" rows={2} defaultValue={values?.format} fieldClassName="sm:col-span-2" />
      {!state.ok ? <FormMessage message={state.message} className="sm:col-span-2" /> : null}
      <DialogActions onCancel={close}>
        <SubmitButton pending={pending} pendingLabel="Salvando...">
          Salvar perfil
        </SubmitButton>
      </DialogActions>
    </form>
  )
}

export function EditVoiceDialog({ values }: { values?: VoiceValues }) {
  return (
    <FormDialog
      title={values ? "Editar perfil de voz" : "Escrever perfil de voz"}
      description="Usado em todas as gerações de IA para que o texto soe como você fala na câmera."
      className="sm:max-w-2xl"
      trigger={
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={Edit02Icon} strokeWidth={1.75} data-icon="inline-start" />
          {values ? "Editar" : "Escrever manualmente"}
        </Button>
      }
    >
      {(close) => <VoiceForm values={values} close={close} />}
    </FormDialog>
  )
}
