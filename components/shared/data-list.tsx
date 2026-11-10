import type { ReactNode } from "react"
import { InfoHint } from "@/components/shared/info-hint"
import type { GlossaryKey } from "@/lib/youtube/glossary"
import { cn } from "@/lib/utils"

export type DataItem = {
  label: string
  value: ReactNode
  /** Ocupa a linha inteira (textos longos). */
  wide?: boolean
  /** Explicação em linguagem simples ("?"): termo do glossário ou texto próprio. */
  term?: GlossaryKey
  hint?: string
}

/** Dados em modo leitura: rótulo técnico (MetaLabel) e valor, em grade. Vazio aparece como "—". */
export function DataList({ items, className }: { items: DataItem[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-5 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <div key={item.label} className={cn("flex min-w-0 flex-col gap-1", item.wide && "sm:col-span-full")}>
          <dt className="label flex items-center gap-1">
            {item.label}
            {item.term || item.hint ? <InfoHint term={item.term} text={item.hint} label={item.label} /> : null}
          </dt>
          <dd className="text-sm break-words whitespace-pre-line text-foreground">
            {item.value === null || item.value === undefined || item.value === "" ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
