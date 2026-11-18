import type { Metadata } from "next"
import Link from "next/link"
import { env } from "@/lib/env"
import { SupportActions } from "./support-actions"

export const metadata: Metadata = { title: "Esqueci minha senha · CCD Studio" }

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-ccd-teal-light/80 uppercase">
          <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-ccd-gold-light" />
          Suporte
        </span>
        <h1 className="text-3xl font-bold text-white">Esqueceu sua senha?</h1>
        <p className="text-sm text-muted-foreground">
          Fale com a gente pelo WhatsApp. Vamos redefinir sua senha para uma senha temporária e, depois de entrar,
          você define uma nova no seu Perfil.
        </p>
      </div>
      <SupportActions whatsapp={env.SUPPORT_WHATSAPP} email={env.SUPPORT_EMAIL} />
      <Link href="/login" className="self-start text-sm font-medium text-primary underline-offset-4 hover:underline">
        ← Voltar para o login
      </Link>
    </>
  )
}
