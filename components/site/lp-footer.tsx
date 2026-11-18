import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons"
import { StudioLogo, StudioWordmark } from "./studio-logo"

const LINKS = [
  { href: "/login", label: "Entrar" },
  { href: "/termos", label: "Termos de uso" },
  { href: "/privacidade", label: "Política de privacidade" },
]

/** Rodapé navy-darker: chamada com CTA dourado, colunas, marca d'água e links legais. Estático. */
export function LpFooter() {
  return (
    <footer className="relative overflow-hidden bg-ccd-navy-darker text-white">
      <div aria-hidden className="absolute inset-0 lp-glows opacity-60" />
      <div aria-hidden className="absolute inset-0 lp-grid-down" />

      <div className="relative mx-auto max-w-6xl px-4 md:px-8">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-white/10 py-14 md:flex-row md:items-center">
          <div>
            <p className="font-mono text-[11px] tracking-[0.3em] text-ccd-teal-light/80 uppercase">Pronto para gravar?</p>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">
              Seu próximo vídeo começa no <span className="text-gradient-gold">CCD Studio</span>
            </h2>
          </div>
          <div className="flex items-center gap-8">
          <StudioLogo mode="interactive" title="" className="hidden w-36 text-white md:block lg:w-44" />
          <Link
            href="/login"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-linear-to-r from-ccd-gold to-ccd-gold-light px-6 text-sm font-semibold text-ccd-navy transition-opacity hover:opacity-90"
          >
            Entrar no Studio
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
          </Link>
          </div>
        </div>

        <div className="grid gap-10 py-14 md:grid-cols-12">
          <div className="md:col-span-7">
            <StudioWordmark tone="light" />
            <p className="mt-4 max-w-md text-sm text-white/55">
              A ferramenta de criação para YouTube da AM Educação: análises do canal e textos prontos, gerados com IA a
              partir dos seus próprios dados.
            </p>
          </div>
          <div className="md:col-span-5">
            <p className="font-mono text-[11px] tracking-widest text-white/40 uppercase">Links</p>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex items-center gap-1.5 text-white/70 transition-colors hover:text-ccd-gold-light"
                  >
                    {l.label}
                    <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p
        aria-hidden
        className="relative -mb-[3vw] text-center text-[18vw] leading-none font-bold tracking-tight whitespace-nowrap text-white/[0.035] select-none md:text-[13vw]"
      >
        CCD STUDIO
      </p>

      <div className="relative border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/45 md:px-8">
          © 2026 AM Educação · CCD Studio
        </p>
      </div>
    </footer>
  )
}
