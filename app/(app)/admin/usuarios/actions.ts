"use server"

import { revalidatePath } from "next/cache"
import { env } from "@/lib/env"
import { canAdjustCredits, canCreateRole, canManage, requireRole } from "@/lib/auth/dal"
import { adjustCreditsSchema, createUserSchema, userIdSchema, type FormState } from "@/lib/auth/schemas"
import { createAdminClient } from "@/lib/supabase/admin"

// Toda action revalida o papel do autor no servidor antes de usar o service role.

const PATH = "/admin/usuarios"
const BAN_FOREVER = "876000h" // ~100 anos

async function loadTarget(id: unknown) {
  const parsed = userIdSchema.safeParse(id)
  if (!parsed.success) return null
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id, role, is_active, email")
    .eq("id", parsed.data)
    .single()
  return data
}

export async function createUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireRole("admin")

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role") || "user",
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const { name, email, role } = parsed.data

  if (!canCreateRole(actor, role)) return { message: "Você não tem permissão para criar esse tipo de conta." }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: env.DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  })
  if (error || !data.user) {
    if (error?.code === "email_exists") return { fieldErrors: { email: ["Já existe uma conta com esse e-mail"] } }
    return { message: "Não foi possível criar o usuário." }
  }

  // O trigger cria o profile como "user"; aqui definimos papel, nome e a troca obrigatória de senha.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ name, role, must_change_password: true, created_by: actor.id })
    .eq("id", data.user.id)
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id)
    return { message: "Não foi possível criar o usuário." }
  }

  revalidatePath(PATH)
  return { ok: true, message: `${name} criado. Ele entra com a senha temporária e verá um aviso para trocá-la.` }
}

export async function setUserActive(id: string, active: boolean): Promise<FormState> {
  const actor = await requireRole("admin")
  const target = await loadTarget(id)
  if (!target || !canManage(actor, target)) return { message: "Você não tem permissão para alterar esta conta." }

  const admin = createAdminClient()
  // O ban no Auth bloqueia login e renovação de sessão imediatamente.
  const { error } = await admin.auth.admin.updateUserById(target.id, { ban_duration: active ? "none" : BAN_FOREVER })
  if (error) return { message: "Não foi possível atualizar a conta." }

  const { error: profileError } = await admin.from("profiles").update({ is_active: active }).eq("id", target.id)
  if (profileError) return { message: "Não foi possível atualizar a conta." }

  revalidatePath(PATH)
  return { ok: true, message: active ? "Conta ativada." : "Conta desativada." }
}

export async function resetUserPassword(id: string): Promise<FormState> {
  const actor = await requireRole("admin")
  const target = await loadTarget(id)
  if (!target || !canManage(actor, target)) return { message: "Você não tem permissão para alterar esta conta." }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(target.id, { password: env.DEFAULT_PASSWORD })
  if (error) return { message: "Não foi possível redefinir a senha." }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ must_change_password: true })
    .eq("id", target.id)
  if (profileError) return { message: "Não foi possível redefinir a senha." }

  revalidatePath(PATH)
  return { ok: true, message: "Senha redefinida para a senha temporária. O usuário verá um aviso para trocá-la." }
}

/** Adiciona ou remove créditos (aparece no extrato do usuário com o motivo). Nunca deixa o saldo negativo. */
export async function adjustUserCredits(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireRole("admin")
  const parsed = adjustCreditsSchema.safeParse({
    userId: formData.get("userId"),
    operacao: formData.get("operacao"),
    quantidade: formData.get("quantidade"),
    tipo: formData.get("tipo"),
    motivo: formData.get("motivo"),
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const { userId, operacao, quantidade, tipo, motivo } = parsed.data

  const target = await loadTarget(userId)
  if (!target || !canAdjustCredits(actor, target)) return { message: "Você não tem permissão para alterar esta conta." }

  const amount = operacao === "adicionar" ? quantidade : -quantidade
  const { data, error } = await createAdminClient().rpc("adjust_credits", {
    p_user: target.id,
    p_bucket: tipo,
    p_amount: amount,
    p_note: motivo,
    p_actor: actor.id,
  })
  if (error) {
    if (error.message.includes("insufficient_balance")) {
      const has = Number(error.details) || 0
      const kind = tipo === "free" ? "gratuitos" : "comprados"
      return { fieldErrors: { quantidade: [`O usuário só tem ${has} ${has === 1 ? "crédito" : "créditos"} ${kind}.`] } }
    }
    console.error("[credits] ajuste falhou", error.code)
    return { message: "Não foi possível ajustar os créditos." }
  }

  revalidatePath(PATH)
  revalidatePath("/conta/planos")
  const verb = operacao === "adicionar" ? "adicionados" : "removidos"
  return { ok: true, message: `${quantidade} ${quantidade === 1 ? "crédito" : "créditos"} ${verb}. Novo saldo desse tipo: ${data}.` }
}
