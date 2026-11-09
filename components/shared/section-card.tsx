import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type SectionCardProps = {
  title: string
  description?: ReactNode
  /** Botões da seção (ex.: "Editar" que abre um FormDialog). */
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Bloco de seção (padrão FormSection do Precifica): título e descrição à esquerda,
 * conteúdo à direita, num card plano com borda. Usado em modo leitura; a edição
 * abre em modal pelo botão em `actions`.
 */
export function SectionCard({ title, description, actions, children, className }: SectionCardProps) {
  return (
    <section
      className={cn(
        "grid gap-6 rounded-xl border border-border bg-card p-6 lg:grid-cols-[minmax(0,240px)_1fr] lg:p-7",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}
