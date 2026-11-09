import type { ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import type { IconKey } from "@/lib/navigation"
import { NAV_ICONS } from "./nav-icons"

type PageHeaderProps = {
  /** Rótulo curto em mono/caixa alta acima do título. */
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** Ícone da seção (o mesmo do menu), em marca d'água no canto do bloco. */
  icon?: IconKey
  className?: string
}

/**
 * Cabeçalho da página em bloco de superfície: brilho azul sutil no canto e o ícone
 * da seção em marca d'água. Título, descrição e ações por cima.
 */
export function PageHeader({ eyebrow, title, description, actions, icon, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "relative isolate overflow-hidden rounded-2xl border border-border bg-card px-6 py-6 sm:px-8 sm:py-7",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 -right-20 -z-10 size-80 rounded-full bg-primary/10 blur-3xl"
      />
      {icon ? (
        <HugeiconsIcon
          icon={NAV_ICONS[icon]}
          aria-hidden
          strokeWidth={1.25}
          className="pointer-events-none absolute -right-6 -bottom-10 -z-10 size-44 text-primary/[0.07]"
        />
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {eyebrow ? (
            <span className="label flex items-center gap-1.5">
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              {eyebrow}
            </span>
          ) : null}
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground">{title}</h1>
          {description ? <div className="max-w-2xl text-sm text-muted-foreground">{description}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
