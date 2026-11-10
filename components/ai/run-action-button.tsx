"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import type { FormState } from "@/lib/auth/schemas"

type Props = {
  action: () => Promise<FormState>
  label: string
  pendingLabel?: string
  disabled?: boolean
  variant?: "default" | "outline" | "ghost" | "secondary"
}

/** Botão que dispara uma geração de IA sem formulário (ex.: "Gerar próximas ideias · 1 crédito"). */
export function RunActionButton({ action, label, pendingLabel = "Gerando…", disabled, variant = "default" }: Props) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant={variant}
      size="sm"
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          const r = await action()
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
      {pending ? pendingLabel : label}
    </Button>
  )
}
