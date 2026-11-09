"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormMessage, TextField } from "@/components/forms/form-field"
import type { FormState } from "@/lib/auth/schemas"
import { createUser } from "./actions"

function CreateUserFields({
  canCreateAdmin,
  onCreated,
}: {
  canCreateAdmin: boolean
  onCreated: (message: string) => void
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(createUser, {})

  useEffect(() => {
    if (state.ok && state.message) onCreated(state.message)
  }, [state, onCreated])

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <TextField label="Nome" name="name" autoComplete="off" required autoFocus errors={state.fieldErrors?.name} />
        <TextField label="E-mail" name="email" type="email" autoComplete="off" required errors={state.fieldErrors?.email} />
        {canCreateAdmin ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="role" className="text-[13px] font-semibold text-foreground">
              Tipo de conta
            </Label>
            <select
              id="role"
              name="role"
              defaultValue="user"
              className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="user">
                Usuário
              </option>
              <option value="admin">
                Admin
              </option>
            </select>
          </div>
        ) : (
          <input type="hidden" name="role" value="user" />
        )}
        {!state.ok ? <FormMessage message={state.message} /> : null}
      </div>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="ghost" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Criando…" : "Criar usuário"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function CreateUserDialog({ canCreateAdmin }: { canCreateAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  // Remonta o formulário a cada abertura: campos e erros começam limpos.
  const [formKey, setFormKey] = useState(0)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setFormKey((k) => k + 1)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
        Novo usuário
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>
            A conta é criada com a senha temporária padrão. O usuário verá um aviso para trocá-la no Perfil.
          </DialogDescription>
        </DialogHeader>
        <CreateUserFields
          key={formKey}
          canCreateAdmin={canCreateAdmin}
          onCreated={(message) => {
            toast.success(message)
            setOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
