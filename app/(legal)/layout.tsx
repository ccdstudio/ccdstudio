import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"

// Páginas públicas de conteúdo (termos, privacidade), sem login.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-4 py-12 sm:px-8 sm:py-16">{children}</main>
      <SiteFooter />
    </>
  )
}
