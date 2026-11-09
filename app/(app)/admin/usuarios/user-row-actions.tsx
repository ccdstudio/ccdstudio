"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { resetUserPassword, setUserActive } from "./actions"

export function UserRowActions({ id, name, isActive }: { id: string; name: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition()

  function run(task: () => Promise<{ ok?: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await task()
      if (result.ok) toast.success(result.message)
      else toast.error(result.message ?? "Algo deu errado.")
    })
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="xs"
        variant="secondary"
        disabled={pending}
        onClick={() => run(() => resetUserPassword(id))}
        aria-label={`Resetar senha de ${name}`}
      >
        Resetar senha
      </Button>
      <Button
        size="xs"
        variant={isActive ? "destructive" : "outline"}
        disabled={pending}
        onClick={() => run(() => setUserActive(id, !isActive))}
        aria-label={`${isActive ? "Desativar" : "Ativar"} ${name}`}
      >
        {isActive ? "Desativar" : "Ativar"}
      </Button>
    </div>
  )
}
