import Link from "next/link"
import { Quicksand } from "next/font/google"
import { AuthBackdrop, AuthCard, AuthShowcase } from "@/components/site/auth-stage"
import { StudioWordmark } from "@/components/site/studio-logo"

// Telas de acesso no design da landing (DESIGN - LP.md): fundo navy animado, formulário num cartão
// à esquerda e a marca à direita (desktop). Sempre escuro: `dark` + `auth-ccd` re-tematizam os tokens
// dos componentes do formulário, que continuam os mesmos do app.
const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-quicksand" })

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`lp dark auth-ccd ${quicksand.variable} flex min-h-svh flex-1 flex-col font-lp text-white`}>
      <AuthBackdrop>
        <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-16 px-4 py-8 md:px-8 lg:grid-cols-2">
          <div className="flex flex-col items-center gap-8 lg:items-start">
            <Link href="/" aria-label="CCD Studio — voltar ao site">
              <StudioWordmark tone="light" />
            </Link>
            <AuthCard className="w-full max-w-md">
              <main className="flex flex-col gap-8 rounded-[2rem] border border-white/10 bg-ccd-navy p-6 shadow-lp-panel sm:p-8">
                {children}
              </main>
            </AuthCard>
            <span className="font-mono text-[10px] tracking-[0.3em] text-white/35 uppercase">
              © AM Educação · CCD Studio
            </span>
          </div>
          <div className="hidden lg:block">
            <AuthShowcase />
          </div>
        </div>
      </AuthBackdrop>
    </div>
  )
}
