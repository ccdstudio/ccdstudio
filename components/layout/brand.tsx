import Link from "next/link"
import { StudioMark } from "@/components/site/studio-logo"
import { cn } from "@/lib/utils"

/** Ícone da marca (etiqueta preenchida: teal, play branco, brilho dourado). Funciona nos dois temas. */
export function BrandIcon({ className }: { className?: string }) {
  return <StudioMark className={cn("h-4 w-auto shrink-0", className)} />
}

/** Marca: ícone + "CCD" (cor do tema) + "Studio" em ouro. Usada no cabeçalho das páginas públicas. */
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5" aria-label="CCD Studio">
      <BrandIcon className="h-7" />
      <span className="font-heading text-[17px] font-extrabold tracking-[-0.03em]">
        CCD <span className="text-gradient-gold">Studio</span>
      </span>
    </Link>
  )
}
