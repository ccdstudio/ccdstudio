"use client"

import { useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

/** Copia um texto para a área de transferência, com toast. Usado nos resultados das ferramentas de IA. */
export function CopyButton({ text, label = "Copiar", what }: { text: string; label?: string; what?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(what ? `${what} copiado.` : "Copiado.")
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.")
    }
  }

  return (
    <Button type="button" variant="outline" size="xs" onClick={copy} aria-label={what ? `Copiar ${what.toLowerCase()}` : label}>
      <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={1.75} data-icon="inline-start" />
      {copied ? "Copiado" : label}
    </Button>
  )
}
