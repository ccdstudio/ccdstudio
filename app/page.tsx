import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import { SiteHeader } from "@/components/layout/site-header"
import { buttonVariants } from "@/components/ui/button"

const BENEFITS = [
  ["Roteiros e metadados.", "Títulos, descrições e tags otimizados para o YouTube."],
  ["Thumbnails e cortes.", "Ideias de thumbnail, shorts e capítulos a partir do vídeo."],
  ["Tudo em um lugar.", "Histórico das gerações e créditos sempre à vista."],
]

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center gap-10 px-4 py-20 sm:px-8">
        <span className="label flex items-center gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full bg-primary" />
          AM Educação
        </span>
        <h1 className="max-w-4xl text-5xl leading-[1.05] font-extrabold tracking-[-0.04em] sm:text-7xl">
          Conteúdo para YouTube com IA, do roteiro à thumbnail.
        </h1>
        <ul className="flex flex-col gap-3">
          {BENEFITS.map(([title, description]) => (
            <li key={title} className="flex items-start gap-3 text-[15px]">
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.25} className="mt-0.5 size-[18px] shrink-0 text-info" />
              <span>
                <strong className="font-semibold">{title}</strong>{" "}
                <span className="text-muted-foreground">{description}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Entrar no CCD Studio
          </Link>
        </div>
      </main>
    </>
  )
}
