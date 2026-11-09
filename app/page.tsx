import Link from "next/link"
import { SiteHeader } from "@/components/layout/site-header"
import { buttonVariants } from "@/components/ui/button"

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-svh flex-1 flex-col justify-end gap-card p-card pt-[120px]">
        <p className="label">AM Educação</p>
        <h1 className="text-[clamp(51px,12vw,160px)] leading-[0.9]">CCD Studio</h1>
        <div className="divider-dashed" />
        <div className="grid gap-gutter md:grid-cols-[1fr_auto] md:items-end">
          <p className="max-w-3xl text-lg md:text-body">
            Ambiente pronto para desenvolver. Os tokens e componentes do design estão em{" "}
            <Link href="/design" className="underline underline-offset-4">/design</Link>.
          </p>
          <Link href="/design" className={buttonVariants({ size: "lg" })}>
            Ver o design system
          </Link>
        </div>
        <p className="legal text-ember">* Built by AM Educação</p>
      </main>
    </>
  )
}
