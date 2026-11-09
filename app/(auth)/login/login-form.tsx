"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FormMessage, TextField } from "@/components/forms/form-field"
import { signIn } from "./actions"

const notices: Record<string, string> = {
  inativa: "Sua conta está desativada. Fale com o suporte.",
  saiu: "Você saiu da sua conta.",
}

export function LoginForm() {
  const params = useSearchParams()
  const [state, action, pending] = useActionState(signIn, {})
  const notice = notices[params.get("motivo") ?? ""]

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={params.get("next") ?? ""} />
      {notice && !state.message ? (
        <p role="status" className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          {notice}
        </p>
      ) : null}
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
      <Link href="/esqueci-senha" className="self-center text-sm font-medium text-primary underline-offset-4 hover:underline">
        Esqueceu sua senha?
      </Link>
    </form>
  )
}
