"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { CoinsDollarIcon } from "@hugeicons/core-free-icons"
import { Field, FormMessage, TextField } from "@/components/forms/form-field"
import { SubmitButton } from "@/components/forms/submit-button"
import { FormDialog } from "@/components/shared/form-dialog"
import { Button } from "@/components/ui/button"
import type { FormState } from "@/lib/auth/schemas"
import { cn } from "@/lib/utils"
import { GLOSSARY } from "@/lib/youtube/glossary"
import { adjustUserCredits } from "./actions"

type Props = { userId: string; name: string; free: number; purchased: number }

/** Grupo de opções em cartões (radio nativo, acessível por teclado). */
function Choice({
  name,
  defaultValue,
  options,
}: {
  name: string
  defaultValue: string
  options: { value: string; label: string; hint?: string }[]
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            "flex cursor-pointer flex-col gap-0.5 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50",
            "has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
          )}
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <input type="radio" name={name} value={o.value} defaultChecked={o.value === defaultValue} className="accent-primary" />
            {o.label}
          </span>
          {o.hint ? <span className="pl-5 text-xs text-muted-foreground">{o.hint}</span> : null}
        </label>
      ))}
    </div>
  )
}

function AdjustCreditsFields({ userId, free, purchased, close }: Props & { close: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(adjustUserCredits, {})

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message)
      close()
    }
  }, [state, close])

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="userId" value={userId} />

      <dl className="grid grid-cols-3 gap-2 rounded-xl border border-border p-3 text-center">
        {[
          { label: "Total", value: free + purchased },
          { label: "Gratuitos", value: free },
          { label: "Comprados", value: purchased },
        ].map((i) => (
          <div key={i.label} className="flex flex-col">
            <dt className="label">{i.label}</dt>
            <dd className="font-heading text-xl font-extrabold tabular-nums">{i.value}</dd>
          </div>
        ))}
      </dl>

      <Field id="campo-operacao" label="O que fazer" errors={state.fieldErrors?.operacao}>
        <Choice
          name="operacao"
          defaultValue="adicionar"
          options={[
            { value: "adicionar", label: "Adicionar" },
            { value: "remover", label: "Remover" },
          ]}
        />
      </Field>

      <TextField
        name="quantidade"
        label="Quantidade"
        type="number"
        inputMode="numeric"
        min={1}
        max={1000}
        defaultValue={5}
        required
        errors={state.fieldErrors?.quantidade}
      />

      <Field id="campo-tipo" label="Tipo de crédito" errors={state.fieldErrors?.tipo}>
        <Choice
          name="tipo"
          defaultValue="purchased"
          options={[
            { value: "purchased", label: "Comprado (não expira)", hint: GLOSSARY.creditosComprados },
            { value: "free", label: "Gratuito (some no dia 1)", hint: GLOSSARY.creditosGratuitos },
          ]}
        />
      </Field>

      <TextField
        name="motivo"
        label="Motivo"
        required
        placeholder="Ex.: Cortesia de boas-vindas"
        hint="Aparece no extrato do usuário."
        errors={state.fieldErrors?.motivo}
      />

      {!state.ok ? <FormMessage message={state.message} /> : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={close} disabled={pending}>
          Cancelar
        </Button>
        <SubmitButton pending={pending} pendingLabel="Salvando…">
          Salvar ajuste
        </SubmitButton>
      </div>
    </form>
  )
}

export function AdjustCreditsDialog(props: Props) {
  return (
    <FormDialog
      title={`Créditos de ${props.name}`}
      description="Adicione ou remova créditos. O saldo nunca fica negativo e o ajuste aparece no extrato do usuário."
      trigger={
        <Button size="xs" variant="outline" aria-label={`Ajustar créditos de ${props.name}`}>
          <HugeiconsIcon icon={CoinsDollarIcon} strokeWidth={1.75} data-icon="inline-start" />
          Créditos
        </Button>
      }
    >
      {(close) => <AdjustCreditsFields {...props} close={close} />}
    </FormDialog>
  )
}
