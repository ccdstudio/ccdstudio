import type { ReactNode } from "react"
import { InfoHint } from "@/components/shared/info-hint"
import { cn } from "@/lib/utils"
import type { GlossaryKey } from "@/lib/youtube/glossary"

type SectionCardProps = {
  title: string
  description?: ReactNode
  /** Botões da seção (ex.: "Editar" que abre um FormDialog). */
  actions?: ReactNode
  children: ReactNode
  className?: string
  /** Âncora (ex.: /perfil#canal). */
  id?: string
  /** "?" ao lado do título, com explicação em linguagem simples. */
  term?: GlossaryKey
  hint?: string
}

/**
 * Bloco de seção (padrão FormSection do Precifica): título e descrição à esquerda,
 * conteúdo à direita, num card plano com borda. Usado em modo leitura; a edição
 * abre em modal pelo botão em `actions`.
 */
export function SectionCard({ title, description, actions, children, className, id, term, hint }: SectionCardProps) {
  return (
    <section
      id={id}
      className={cn(
        "grid scroll-mt-20 gap-6 rounded-xl border border-border bg-card p-6 lg:grid-cols-[minmax(0,240px)_1fr] lg:p-7",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-1.5 text-base font-bold">
          {title}
          {term || hint ? <InfoHint term={term} text={hint} label={title} /> : null}
        </h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}
