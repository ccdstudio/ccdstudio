"use client"

import { useActionState, useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit02Icon, SecurityLockIcon } from "@hugeicons/core-free-icons"
import { FormMessage, TextField } from "@/components/forms/form-field"
import { SubmitButton } from "@/components/forms/submit-button"
import { FormDialog } from "@/components/shared/form-dialog"
import { DialogActions, useOnSuccess } from "@/components/shared/form-helpers"
import { Button } from "@/components/ui/button"
import type { FormState } from "@/lib/auth/schemas"
import { changePassword, updateProfile } from "./actions"

// Convenção do projeto: edição sempre em modal (FormDialog), a página fica só em leitura.

/* ---------------- Dados pessoais ---------------- */

function AccountForm({ name, email, close }: { name: string; email: string; close: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {})
  useOnSuccess(state, close)

  return (
    <form action={action} noValidate className="grid gap-4 sm:grid-cols-2">
      <TextField
        name="name"
        label="Nome"
        defaultValue={name}
        autoComplete="name"
        required
        autoFocus
        errors={state.fieldErrors?.name}
        fieldClassName="sm:col-span-2"
      />
      <TextField
        name="emailReadonly"
        label="E-mail"
        defaultValue={email}
        disabled
        hint="O e-mail de acesso não pode ser alterado. Fale com o suporte."
        fieldClassName="sm:col-span-2"
      />
      {!state.ok ? <FormMessage message={state.message} className="sm:col-span-2" /> : null}
      <DialogActions onCancel={close}>
        <SubmitButton pending={pending} pendingLabel="Salvando...">
          Salvar
        </SubmitButton>
      </DialogActions>
    </form>
  )
}

export function EditAccountDialog({ name, email }: { name: string; email: string }) {
  return (
    <FormDialog
      title="Editar dados pessoais"
      description="Tipo de conta e status são definidos pelo administrador."
      trigger={
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={Edit02Icon} strokeWidth={1.75} data-icon="inline-start" />
          Editar dados
        </Button>
      }
    >
      {(close) => <AccountForm name={name} email={email} close={close} />}
    </FormDialog>
  )
}

/* ---------------- Senha ---------------- */

function PasswordForm({ mustChange, close }: { mustChange: boolean; close: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {})
  useOnSuccess(state, close)

  return (
    <form action={action} noValidate className="grid gap-4 sm:grid-cols-2">
      <TextField
        name="currentPassword"
        label={mustChange ? "Senha atual (temporária)" : "Senha atual"}
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        errors={state.fieldErrors?.currentPassword}
        fieldClassName="sm:col-span-2"
      />
      <TextField
        name="newPassword"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        required
        hint="Mínimo de 8 caracteres, com letras e números."
        errors={state.fieldErrors?.newPassword}
      />
      <TextField
        name="confirmPassword"
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.confirmPassword}
      />
      {!state.ok ? <FormMessage message={state.message} className="sm:col-span-2" /> : null}
      <DialogActions onCancel={close}>
        <SubmitButton pending={pending} pendingLabel="Alterando...">
          Alterar senha
        </SubmitButton>
      </DialogActions>
    </form>
  )
}

export function ChangePasswordDialog({ mustChange }: { mustChange: boolean }) {
  const [open, setOpen] = useState(false)

  // O aviso da sidebar leva a /perfil#seguranca: abre o modal direto.
  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === "#seguranca") {
        setOpen(true)
        history.replaceState(null, "", window.location.pathname)
      }
    }
    openFromHash()
    window.addEventListener("hashchange", openFromHash)
    return () => window.removeEventListener("hashchange", openFromHash)
  }, [])

  return (
    <FormDialog
      title="Alterar senha"
      description={
        mustChange
          ? "Você está usando uma senha temporária. Defina uma senha pessoal."
          : "Para alterar, confirme a sua senha atual."
      }
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant={mustChange ? "default" : "outline"} size="sm">
          <HugeiconsIcon icon={SecurityLockIcon} strokeWidth={1.75} data-icon="inline-start" />
          Alterar senha
        </Button>
      }
    >
      {(close) => <PasswordForm mustChange={mustChange} close={close} />}
    </FormDialog>
  )
}
