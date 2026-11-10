import type { ReactNode } from "react"

export type LegalSection = { id: string; title: string; content: ReactNode }

type LegalDocumentProps = {
  eyebrow: string
  title: string
  updatedAt: string
  intro: ReactNode
  sections: LegalSection[]
}

/** Documento legal público (termos, privacidade): índice + seções numeradas num card. */
export function LegalDocument({ eyebrow, title, updatedAt, intro, sections }: LegalDocumentProps) {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="label flex items-center gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full bg-primary" />
          {eyebrow}
        </span>
        <h1 className="text-4xl leading-[1.1] font-extrabold tracking-[-0.04em] sm:text-5xl">{title}</h1>
        <p className="text-sm text-muted-foreground">Última atualização: {updatedAt}</p>
      </header>

      <div className="flex flex-col gap-4 text-[15px] leading-relaxed">{intro}</div>

      <nav aria-label="Nesta página" className="rounded-xl border border-border bg-card p-5">
        <p className="label mb-3">Nesta página</p>
        <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="text-primary underline-offset-4 hover:underline">
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-col gap-8 rounded-xl border border-border bg-card p-6 sm:p-8">
        {sections.map((section, index) => (
          <section key={section.id} id={section.id} className="flex scroll-mt-24 flex-col gap-3">
            <h2 className="text-xl font-bold">
              {index + 1}. {section.title}
            </h2>
            <div className="flex flex-col gap-3 text-[15px] leading-relaxed [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline [&_li]:pl-1 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
              {section.content}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}
