import Link from "next/link"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { Brand } from "./brand"

const nav = [
  { href: "/", label: "Início" },
]

// Topo das páginas públicas: marca, navegação em pílulas e CTA "Entrar".
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-8">
        <Brand />
        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground sm:inline-flex"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ className: "ml-1" })}>
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  )
}
