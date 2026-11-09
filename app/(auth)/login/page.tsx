import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Entrar · CCD Studio" }

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="label">Acesso restrito</span>
        <h1 className="text-[34px] leading-[1.2] font-extrabold tracking-[-0.04em]">Entrar</h1>
        <p className="text-sm text-muted-foreground">Use o e-mail e a senha fornecidos pelo administrador.</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  )
}
