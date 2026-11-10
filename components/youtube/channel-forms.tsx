"use client"

import { useActionState, useState, useTransition } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowReloadHorizontalIcon, Delete02Icon, Edit02Icon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { FormMessage, TextField } from "@/components/forms/form-field"
import { SubmitButton } from "@/components/forms/submit-button"
import { FormDialog } from "@/components/shared/form-dialog"
import { Button } from "@/components/ui/button"
import type { FormState } from "@/lib/auth/schemas"
import { DialogActions, useOnSuccess } from "@/components/shared/form-helpers"
import { refreshYoutubeChannel, removeYoutubeChannel, saveYoutubeChannel } from "@/lib/youtube/actions"

/* ---------------- Adicionar / trocar canal ---------------- */

function ChannelForm({ current, close }: { current?: string; close: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveYoutubeChannel, {})
  useOnSuccess(state, close)

  return (
    <form action={action} noValidate className="grid gap-4">
      <TextField
        name="channel"
        label="@handle ou link do canal"
        defaultValue={current}
        placeholder="@seucanal"
        autoComplete="off"
        spellCheck={false}
        required
        autoFocus
        hint="Ex.: @seucanal ou https://www.youtube.com/@seucanal"
        errors={state.fieldErrors?.channel}
      />
      {!state.ok ? <FormMessage message={state.message} /> : null}
      <DialogActions onCancel={close}>
        <SubmitButton pending={pending} pendingLabel="Buscando canal...">
          Salvar canal
        </SubmitButton>
      </DialogActions>
    </form>
  )
}

export function ChannelDialog({ current, disabled }: { current?: string; disabled?: boolean }) {
  const editing = Boolean(current)
  return (
    <FormDialog
      title={editing ? "Trocar canal do YouTube" : "Adicionar canal do YouTube"}
      description="Usamos só os dados públicos do canal (nome, foto e números)."
      trigger={
        <Button variant={editing ? "outline" : "default"} size="sm" disabled={disabled}>
          <HugeiconsIcon icon={editing ? Edit02Icon : PlusSignIcon} strokeWidth={1.75} data-icon="inline-start" />
          {editing ? "Trocar canal" : "Adicionar canal"}
        </Button>
      }
    >
      {(close) => <ChannelForm current={current} close={close} />}
    </FormDialog>
  )
}

/* ---------------- Atualizar ---------------- */

export function RefreshChannelButton({ disabled }: { disabled?: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          const result = await refreshYoutubeChannel()
          if (result.ok) toast.success(result.message)
          else toast.error(result.message ?? "Algo deu errado.")
        })
      }
    >
      <HugeiconsIcon icon={ArrowReloadHorizontalIcon} strokeWidth={1.75} data-icon="inline-start" />
      {pending ? "Atualizando..." : "Atualizar"}
    </Button>
  )
}

/* ---------------- Remover (com confirmação) ---------------- */

function RemoveConfirm({ title, close }: { title: string; close: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        O canal <strong className="font-semibold text-foreground">{title}</strong> deixa de ser usado nas ferramentas.
        Você pode adicioná-lo de novo quando quiser.
      </p>
      <FormMessage message={error} />
      <DialogActions onCancel={close}>
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await removeYoutubeChannel()
              if (result.ok) {
                toast.success(result.message)
                close()
              } else setError(result.message)
            })
          }
        >
          {pending ? "Removendo..." : "Remover canal"}
        </Button>
      </DialogActions>
    </div>
  )
}

export function RemoveChannelDialog({ title }: { title: string }) {
  return (
    <FormDialog
      title="Remover canal?"
      trigger={
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.75} data-icon="inline-start" />
          Remover
        </Button>
      }
    >
      {(close) => <RemoveConfirm title={title} close={close} />}
    </FormDialog>
  )
}
