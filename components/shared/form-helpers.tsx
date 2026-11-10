"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { FormState } from "@/lib/auth/schemas"

/** Mostra o toast de sucesso e fecha o modal quando a action retorna ok. */
export function useOnSuccess(state: FormState, onSuccess: () => void) {
  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message)
      onSuccess()
    }
  }, [state])
}

/** Rodapé padrão dos formulários em modal: Cancelar + ação principal. */
export function DialogActions({ onCancel, children }: { onCancel: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancelar
      </Button>
      {children}
    </div>
  )
}
