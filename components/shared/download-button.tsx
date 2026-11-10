"use client"

import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

/** Baixa um texto como arquivo (padrão: Markdown), gerado no próprio navegador. */
export function DownloadButton({
  text,
  filename,
  label = "Baixar",
  what,
  mime = "text/markdown;charset=utf-8",
}: {
  text: string
  filename: string
  label?: string
  what?: string
  mime?: string
}) {
  function download() {
    try {
      const url = URL.createObjectURL(new Blob([text], { type: mime }))
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success(what ? `${what} baixado.` : "Arquivo baixado.")
    } catch {
      toast.error("Não foi possível baixar o arquivo. Tente copiar o texto.")
    }
  }

  return (
    <Button type="button" onClick={download}>
      <HugeiconsIcon icon={Download01Icon} strokeWidth={1.75} data-icon="inline-start" />
      {label}
    </Button>
  )
}
