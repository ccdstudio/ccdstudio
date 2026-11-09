import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type DataItem = {
  label: string
  value: ReactNode
  /** Ocupa a linha inteira (textos longos). */
  wide?: boolean
}

/** Dados em modo leitura: rótulo técnico (MetaLabel) e valor, em grade. Vazio aparece como "—". */
export function DataList({ items, className }: { items: DataItem[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-5 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <div key={item.label} className={cn("flex min-w-0 flex-col gap-1", item.wide && "sm:col-span-full")}>
          <dt className="label">{item.label}</dt>
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
