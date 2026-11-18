import type { ReactNode } from "react"
import { InfoHint } from "@/components/shared/info-hint"
import type { GlossaryKey } from "@/lib/youtube/glossary"

/** Número de destaque com rótulo técnico, "?" explicativo (glossário ou texto livre) e dica abaixo. */
export function Metric({
  label,
  value,
  hint,
  term,
  text,
}: {
  label: string
  value: ReactNode
  hint?: string
  term?: GlossaryKey
  text?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="label flex items-center gap-1">
        {label}
        <InfoHint term={term} text={text} label={label} />
      </span>
      <span className="font-heading text-xl font-bold tracking-[-0.02em] tabular-nums">{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}
