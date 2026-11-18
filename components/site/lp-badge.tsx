import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

const variants = {
  navy: "border-ccd-navy/15 bg-ccd-navy/5 text-ccd-navy",
  teal: "border-ccd-teal/20 bg-ccd-teal/10 text-ccd-teal",
  gold: "border-ccd-gold/25 bg-ccd-gold/10 text-ccd-gold",
  inverted: "border-white/15 bg-white/10 text-white",
}

/** Badge da landing: pílula com texto pequeno, maiúsculo e espaçado. Todo cabeçalho de seção começa com um. */
export function LpBadge({
  children,
  variant = "teal",
  className,
}: {
  children: ReactNode
  variant?: keyof typeof variants
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wider uppercase",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Cabeçalho de seção centralizado: Badge → H2 → parágrafo. */
export function SectionHeading({
  badge,
  badgeVariant,
  title,
  description,
  dark = false,
}: {
  badge: ReactNode
  badgeVariant?: keyof typeof variants
  title: ReactNode
  description?: ReactNode
  dark?: boolean
}) {
  return (
    <div className="text-center">
      <LpBadge variant={badgeVariant ?? (dark ? "inverted" : "teal")}>{badge}</LpBadge>
      <h2 className={cn("mt-4 text-3xl font-bold md:text-4xl", dark ? "text-white" : "text-ccd-ink")}>{title}</h2>
      {description && (
        <p className={cn("mx-auto mt-4 max-w-2xl text-base md:text-lg", dark ? "text-white/60" : "text-ccd-ink/60")}>
          {description}
        </p>
      )}
    </div>
  )
}
