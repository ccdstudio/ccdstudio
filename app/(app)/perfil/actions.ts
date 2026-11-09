"use server"

import { revalidatePath } from "next/cache"
import { env } from "@/lib/env"
import { requireUser } from "@/lib/auth/dal"
import { changePasswordSchema, updateProfileSchema, type FormState } from "@/lib/auth/schemas"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

// Cada action identifica o usuário pela sessão (nunca por id vindo do client)
// e só altera a própria conta.

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()

  const parsed = updateProfileSchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const { error } = await createAdminClient().from("profiles").update({ name: parsed.data.name }).eq("id", user.id)
  if (error) return { message: "Não foi possível salvar. Tente novamente." }

  revalidatePath("/", "layout") // atualiza nome na sidebar
  return { ok: true, message: "Dados atualizados." }
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const { currentPassword, newPassword } = parsed.data

  if (newPassword === env.DEFAULT_PASSWORD) {
    return { fieldErrors: { newPassword: ["Escolha uma senha diferente da senha temporária"] } }
  }

  const supabase = await createClient()

  // Confirma a senha atual (protege contra sessão sequestrada)
  const check = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
  if (check.error) return { fieldErrors: { currentPassword: ["Senha atual incorreta"] } }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    if (error.code === "weak_password") return { fieldErrors: { newPassword: ["Senha muito fraca"] } }
    if (error.code === "same_password") return { fieldErrors: { newPassword: ["Use uma senha diferente da atual"] } }
    return { message: "Não foi possível alterar a senha. Tente novamente." }
  }

  // Senha definitiva: remove o aviso de segurança da sidebar.
  if (user.must_change_password) {
    const { error: flagError } = await createAdminClient()
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", user.id)
    if (flagError) return { message: "Senha alterada, mas não foi possível atualizar seu perfil. Recarregue a página." }
  }

  revalidatePath("/", "layout")
  return { ok: true, message: "Senha alterada com sucesso." }
}
