import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

/** Ícone da marca (traço escuro), para fundos claros. */
export function BrandIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/icon-logo-dark.svg"
      alt=""
      width={265}
      height={141}
      priority
      className={cn("h-4 w-auto shrink-0 dark:invert", className)}
    />
  )
}

/** Marca: ícone + nome, sobre o canvas. */
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-[10px] border border-border bg-card">
        <BrandIcon />
      </span>
      <span className="font-heading text-[17px] font-extrabold tracking-[-0.03em]">CCD Studio</span>
    </Link>
  )
}
