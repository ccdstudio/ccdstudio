import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Entrar · CCD Studio" }

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="label">Acesso restrito</span>
        <h1 className="text-[34px] leading-[1.2] font-extrabold tracking-[-0.04em]">Entrar</h1>
        <p className="text-sm text-muted-foreground">Entre com o Google (mesmo e-mail da sua conta) ou com o e-mail e a senha fornecidos pelo administrador.</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="text-center text-xs text-muted-foreground">
        Ao entrar, você concorda com os{" "}
        <Link href="/termos" className="font-medium text-primary underline-offset-4 hover:underline">
          Termos de uso
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" className="font-medium text-primary underline-offset-4 hover:underline">
          Política de privacidade
        </Link>
        .
      </p>
    </>
  )
}
