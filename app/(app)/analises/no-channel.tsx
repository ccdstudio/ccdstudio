import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { YoutubeIcon } from "@hugeicons/core-free-icons"
import { buttonVariants } from "@/components/ui/button"

/** Estado vazio das análises: sem canal vinculado não há o que analisar. */
export function NoChannel({ what }: { what: string }) {
  return (
    <section className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <HugeiconsIcon icon={YoutubeIcon} strokeWidth={1.5} className="size-7" />
      </span>
      <div className="flex max-w-md flex-col gap-1.5">
        <h2 className="text-xl font-bold">Primeiro, vincule o seu canal</h2>
        <p className="text-sm text-muted-foreground">
          {what} usa os dados públicos do seu canal do YouTube. Leva menos de um minuto: basta informar o @ do canal.
        </p>
      </div>
      <Link href="/meu-canal" className={buttonVariants()}>
        Vincular meu canal
      </Link>
    </section>
  )
}

export const ANALYSIS_EYEBROW = "Análises do canal"
