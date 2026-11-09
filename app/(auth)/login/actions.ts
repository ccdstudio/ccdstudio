"use server"

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
