"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon, Loading03Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { NOTICE } from "@/lib/status-colors"
import { retryVideoPart } from "../actions"

/** Aviso de uma parte que falhou + botão para gerar de novo só ela. */
export function RetryPart({
  packageId,
  part,
  what,
  error,
  cost,
  note,
}: {
  packageId: string
  part: string
  what: string
  error: string
  cost: string
  note?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={1.5} className="size-8 text-muted-foreground" />
      <p className="font-semibold">Não deu para gerar {what}</p>
      <p role="status" className={NOTICE.warning}>
        {error}
      </p>
      {note ? <p className="max-w-md text-xs text-muted-foreground">{note}</p> : null}
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await retryVideoPart(packageId, part)
            if (r.ok) {
              toast.success("Pronto! A parte foi gerada.")
              router.refresh()
            } else toast.error(r.message ?? "Algo deu errado.")
          })
        }
      >
        <HugeiconsIcon
          icon={pending ? Loading03Icon : SparklesIcon}
          strokeWidth={1.75}
          className={pending ? "animate-spin" : undefined}
          data-icon="inline-start"
        />
        {pending ? "Gerando… (pode levar 1 minuto)" : `Gerar de novo só esta parte · ${cost}`}
      </Button>
    </section>
  )
}
