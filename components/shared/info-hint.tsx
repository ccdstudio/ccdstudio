"use client"

import { Popover } from "@base-ui/react/popover"
import { HugeiconsIcon } from "@hugeicons/react"
import { HelpCircleIcon } from "@hugeicons/core-free-icons"
import { GLOSSARY, type GlossaryKey } from "@/lib/youtube/glossary"
import { cn } from "@/lib/utils"

type InfoHintProps = {
  /** Texto do glossário (lib/youtube/glossary.ts) ou um texto próprio. */
  term?: GlossaryKey
  text?: string
  /** Nome do dado, para leitores de tela ("O que é Inscritos?"). */
  label: string
  className?: string
}

/**
 * "?" ao lado de um rótulo, com a explicação em linguagem simples.
 * Popover (e não tooltip) para funcionar também no toque, no celular.
 */
export function InfoHint({ term, text, label, className }: InfoHintProps) {
  const content = text ?? (term ? GLOSSARY[term] : "")
  if (!content) return null

  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={150}
        aria-label={`O que é ${label}?`}
        className={cn(
          "inline-flex size-4 shrink-0 items-center justify-center rounded-full align-middle text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
          className
        )}
      >
        <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={1.75} className="size-3.5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} className="z-50">
          <Popover.Popup className="max-w-72 rounded-lg border border-border bg-popover p-3 text-xs leading-relaxed font-normal tracking-normal normal-case text-popover-foreground shadow-md outline-none">
            <p className="mb-1 font-semibold">{label}</p>
            <p className="text-muted-foreground">{content}</p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
