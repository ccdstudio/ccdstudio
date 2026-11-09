"use client"

import type { ComponentProps } from "react"
import { useFormStatus } from "react-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

type SubmitButtonProps = ComponentProps<typeof Button> & {
  /** Estado de envio controlado (useActionState); sem ele, usa useFormStatus. */
  pending?: boolean
  pendingLabel?: string
}

/** Botão de envio com estado de carregamento (impede envios duplicados). */
export function SubmitButton({ children, pending, pendingLabel, disabled, ...props }: SubmitButtonProps) {
  const status = useFormStatus()
  const sending = pending ?? status.pending

  return (
    <Button type="submit" disabled={sending || disabled} aria-busy={sending} {...props}>
      {sending ? <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="animate-spin" data-icon="inline-start" /> : null}
      {sending && pendingLabel ? pendingLabel : children}
    </Button>
  )
}
