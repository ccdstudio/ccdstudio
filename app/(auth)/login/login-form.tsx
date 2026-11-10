"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { GoogleIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { FormMessage, TextField } from "@/components/forms/form-field"
import { signIn, signInWithGoogle } from "./actions"

const notices: Record<string, string> = {
  inativa: "Sua conta está desativada. Fale com o suporte.",
  saiu: "Você saiu da sua conta.",
  google_sem_conta: "Não existe conta no CCD Studio com este e-mail do Google. Peça acesso ao administrador.",
  google_erro: "Não foi possível entrar com o Google. Tente novamente.",
}

function GoogleButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="lg" className="w-full" disabled={pending}>
      <HugeiconsIcon icon={GoogleIcon} strokeWidth={1.75} data-icon="inline-start" />
      {pending ? "Redirecionando…" : "Entrar com o Google"}
    </Button>
  )
}

export function LoginForm() {
  const params = useSearchParams()
  const [state, action, pending] = useActionState(signIn, {})
  const next = params.get("next") ?? ""
  const notice = notices[params.get("motivo") ?? ""]

  return (
    <div className="flex flex-col gap-5">
      {notice && !state.message ? (
        <p role="status" className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          {notice}
        </p>
      ) : null}

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <GoogleButton />
      </form>

      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        <span className="label text-muted-foreground">ou com e-mail</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={action} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <TextField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          required
          errors={state.fieldErrors?.email}
        />
        <TextField
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          errors={state.fieldErrors?.password}
        />
        <FormMessage message={state.message} />
        <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </Button>
        <Link
          href="/esqueci-senha"
          className="self-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Esqueceu sua senha?
        </Link>
      </form>
    </div>
  )
}
