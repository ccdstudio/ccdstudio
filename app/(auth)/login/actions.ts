"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { loginSchema, safeNext, type FormState } from "@/lib/auth/schemas"

const INVALID = "E-mail ou senha inválidos."
const INACTIVE = "Sua conta está desativada. Fale com o suporte."

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error || !data.user) {
    if (error?.code === "user_banned") return { message: INACTIVE }
    if (error?.status === 429) return { message: "Muitas tentativas. Aguarde alguns minutos e tente de novo." }
    return { message: INVALID } // genérico: não revela se o e-mail existe
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .single()

  if (!profile?.is_active) {
    await supabase.auth.signOut()
    return { message: INACTIVE }
  }

  redirect(safeNext(formData.get("next")))
}

/** Origem do app (http://localhost:3000 em dev) a partir da requisição. */
async function appOrigin() {
  const h = await headers()
  const origin = h.get("origin")
  if (origin) return origin
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

// Login com Google (PKCE): o code verifier fica nos cookies e a troca acontece em /auth/callback.
export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"))
  const callback = new URL("/auth/callback", await appOrigin())
  callback.searchParams.set("next", next)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString(), queryParams: { prompt: "select_account" } },
  })

  if (error || !data.url) {
    console.error("[auth] Google OAuth:", error?.message)
    redirect("/login?motivo=google_erro")
  }
  redirect(data.url)
}
