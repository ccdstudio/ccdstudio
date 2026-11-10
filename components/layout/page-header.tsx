import type { ReactNode } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { buttonVariants } from "@/components/ui/button"
import { PageHelp } from "@/components/shared/page-help"
import type { HelpKey } from "@/lib/help/pages"
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
  /** Ajuda da página (lib/help/pages.tsx): botão de info à direita do texto, abre o vídeo + "Como funciona". */
  help?: HelpKey
  /** Link "Voltar" (rótulo padrão), na esquerda da barra abaixo do banner. */
  back?: { href: string; label?: string }
  className?: string
}

/**
 * Cabeçalho da página em bloco de superfície: brilho azul sutil no canto e o ícone
 * da seção em marca d'água. Texto à esquerda e o botão de ajuda (info) à direita, centralizado com o texto.
 * O "Voltar" (esquerda) e as ações (direita) ficam fora do banner, numa barra logo abaixo.
 */
export function PageHeader({ eyebrow, title, description, actions, icon, help, back, className }: PageHeaderProps) {
  const banner = (
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
      <div className="flex items-center justify-between gap-4">
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
        {help ? <PageHelp help={help} /> : null}
      </div>
    </header>
  )

  if (!actions && !back) return banner
  // Barra logo abaixo do banner: "Voltar" na esquerda, ações (botões) na direita.
  return (
    <div className="flex flex-col gap-4">
      {banner}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {back ? (
          <Link href={back.href} className={buttonVariants({ variant: "ghost" })}>
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.75} data-icon="inline-start" />
            {back.label ?? "Voltar"}
          </Link>
        ) : (
          <span />
        )}
        {actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
