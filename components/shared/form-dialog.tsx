"use client"

import { useState, type ReactElement, type ReactNode } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type FormDialogProps = {
  title: string
  description?: string
  /** Modo não controlado: elemento que abre o diálogo. */
  trigger?: ReactElement
  /** Modo controlado (ex.: aberto por um link ou menu). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  /** Formulário; recebe `close` para chamar após salvar com sucesso. */
  children: (close: () => void) => ReactNode
}

/**
 * Diálogo de formulário padrão (criação/edição). O conteúdo só é montado com o
 * diálogo aberto, então o formulário começa limpo a cada abertura.
 * Convenção do projeto: toda criação/edição usa este componente (ver AGENTS.md).
 */
export function FormDialog({ title, description, trigger, open, onOpenChange, className, children }: FormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen

  function setOpen(value: boolean) {
    if (onOpenChange) onOpenChange(value)
    else setInternalOpen(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className={cn("max-h-[90svh] overflow-y-auto sm:max-w-lg", className)}>
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {isOpen ? children(() => setOpen(false)) : null}
      </DialogContent>
    </Dialog>
  )
}
