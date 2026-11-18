"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { StudioWordmark } from "./studio-logo"

export const LP_SECTIONS = [
  { id: "inicio", label: "Início" },
  { id: "ferramentas", label: "Ferramentas" },
  { id: "analises", label: "Análises" },
  { id: "como-funciona", label: "Como funciona" },
  { id: "creditos", label: "Créditos" },
  { id: "duvidas", label: "Dúvidas" },
]

/** Rola suave até a seção, sem `#` na URL. */
export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

/**
 * Header fixo da landing: transparente sobre a hero (navy) e sólido branco após 24px de rolagem.
 * Sem backdrop-blur. CTA dourado "Entrar no Studio" à direita.
 */
export function LpHeader() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const light = solid || open

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        light ? "border-ccd-border bg-white/95" : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 md:px-8">
        <button
          type="button"
          onClick={() => scrollToSection("inicio")}
          className="flex items-center"
          aria-label="CCD Studio — voltar ao início"
        >
          <StudioWordmark tone={light ? "dark" : "light"} />
        </button>

        <nav className="hidden items-center gap-8 lg:flex">
          {LP_SECTIONS.slice(1).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollToSection(s.id)}
              className={cn(
                "text-sm font-medium transition-colors",
                light ? "text-ccd-ink/70 hover:text-ccd-teal" : "text-white/80 hover:text-white",
              )}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden h-10 items-center gap-2 rounded-xl bg-linear-to-r from-ccd-gold to-ccd-gold-light px-5 text-sm font-semibold text-ccd-navy transition-opacity hover:opacity-90 sm:inline-flex"
          >
            Entrar no Studio
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg lg:hidden",
              light ? "text-ccd-navy hover:bg-ccd-mist" : "text-white hover:bg-white/10",
            )}
          >
            <HugeiconsIcon icon={open ? Cancel01Icon : Menu01Icon} strokeWidth={2} className="size-5" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            key="mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-ccd-border bg-white lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {LP_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    scrollToSection(s.id)
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ccd-ink/80 hover:bg-ccd-mist"
                >
                  {s.label}
                </button>
              ))}
              <Link
                href="/login"
                className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-ccd-gold to-ccd-gold-light px-6 text-sm font-semibold text-ccd-navy"
              >
                Entrar no Studio
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
