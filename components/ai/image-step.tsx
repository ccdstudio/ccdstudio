"use client"

import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, ImageUpload01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

const MAX_SIDE = 1024

/** Reduz a foto no navegador (lado maior ≤ 1024 px, JPEG) e devolve um data URL — leve para enviar ao servidor. */
async function shrink(file: File) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL("image/jpeg", 0.85)
}

/** Passo de foto do formulário em etapas (opcional): escolher, ver a prévia e trocar ou tirar. */
export function ImageStep({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function pick(file: File | undefined) {
    if (!file) return
    setError(null)
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError("Use uma foto JPG, PNG ou WEBP.")
    if (file.size > 15 * 1024 * 1024) return setError("Foto grande demais (máximo de 15 MB).")
    setBusy(true)
    try {
      onChange(await shrink(file))
    } catch {
      setError("Não foi possível ler esta foto. Tente outra.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={label}
        className="sr-only"
        onChange={(e) => {
          void pick(e.target.files?.[0])
          e.target.value = ""
        }}
      />
      {value ? (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Prévia da sua foto" className="size-28 rounded-lg object-cover" />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Foto escolhida</span>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()}>
                Trocar
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.75} data-icon="inline-start" />
                Tirar foto
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <HugeiconsIcon icon={ImageUpload01Icon} strokeWidth={1.5} className="size-8 text-primary" />
          <span className="font-semibold">{busy ? "Preparando a foto…" : "Escolher uma foto"}</span>
          <span className="text-sm text-muted-foreground">Rosto bem iluminado, de frente. JPG, PNG ou WEBP.</span>
        </button>
      )}
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  )
}
