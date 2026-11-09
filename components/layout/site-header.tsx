import Link from "next/link"

const nav = [
  { href: "/", label: "Início" },
  { href: "/design", label: "Design" },
]

// DESIGN.md: nav fixa, transparente, micro-tipografia maiúscula, até 4 itens.
export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-card py-gutter">
      <Link href="/" className="label">
        CCD Studio
      </Link>
      <nav className="flex items-center gap-card">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="label hover:underline hover:decoration-dashed hover:underline-offset-4">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
