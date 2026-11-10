"use client"

import { useActionState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Stethoscope02Icon } from "@hugeicons/core-free-icons"
import { FormMessage } from "@/components/forms/form-field"
import { SubmitButton } from "@/components/forms/submit-button"
import { FormDialog } from "@/components/shared/form-dialog"
import { DialogActions, useOnSuccess } from "@/components/shared/form-helpers"
import { Button } from "@/components/ui/button"
import type { FormState } from "@/lib/auth/schemas"
import { generateAudit } from "./actions"

function AuditForm({ base, extra, close }: { base: number; extra: number; close: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(generateAudit, {})
  useOnSuccess(state, close)

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        A IA lê os seus últimos títulos, o ritmo de postagem e os números já calculados, e devolve <strong>uma</strong> correção
        principal, três coisas que já funcionam e o que não fazer agora.
      </p>
      <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
        <input type="checkbox" name="miniaturas" className="mt-0.5 size-4 accent-primary" />
        <span>
          <strong className="font-semibold">Analisar as 10 últimas miniaturas</strong> (+{extra} crédito)
          <span className="block text-muted-foreground">Avalia o que fica legível no tamanho do feed.</span>
        </span>
      </label>
      {!state.ok ? <FormMessage message={state.message} /> : null}
      <DialogActions onCancel={close}>
        <SubmitButton pending={pending} pendingLabel="Analisando o canal… (até 1 min)">
          Gerar diagnóstico · {base} crédito
        </SubmitButton>
      </DialogActions>
    </form>
  )
}

export function AuditDialog({ base, extra, disabled }: { base: number; extra: number; disabled?: boolean }) {
  return (
    <FormDialog
      title="Diagnóstico do canal"
      description="Termina em UMA correção, não numa lista de vinte."
      trigger={
        <Button disabled={disabled}>
          <HugeiconsIcon icon={Stethoscope02Icon} strokeWidth={1.75} data-icon="inline-start" />
          Gerar diagnóstico
        </Button>
      }
    >
      {(close) => <AuditForm base={base} extra={extra} close={close} />}
    </FormDialog>
  )
}
