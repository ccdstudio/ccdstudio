import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { AppRole, Profile } from "@/lib/supabase/database.types"

export type CurrentUser = Pick<Profile, "id" | "name" | "email" | "role" | "is_active" | "must_change_password" | "youtube_channel_id">

/**
 * Data Access Layer — única porta de entrada para "quem é o usuário".
 * getClaims() valida o JWT no servidor; o profile vem com RLS (o usuário só lê a própria linha).
 * cache() deduplica dentro da mesma requisição.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role, is_active, must_change_password, youtube_channel_id")
    .eq("id", userId)
    .single()

  return profile ?? null
})

/**
 * Exige usuário logado e ativo. Redireciona caso contrário.
 * Senha temporária (must_change_password) não bloqueia o acesso: a sidebar mostra
 * um aviso até o usuário trocar a senha no Perfil.
 */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!user.is_active) redirect("/auth/sair?motivo=inativa")
  return user
}

const rank: Record<AppRole, number> = { user: 0, admin: 1, superadmin: 2 }

export function hasRole(user: Pick<CurrentUser, "role">, min: AppRole) {
  return rank[user.role] >= rank[min]
}

/** Exige papel mínimo. Sem permissão → painel. */
export async function requireRole(min: AppRole) {
  const user = await requireUser()
  if (!hasRole(user, min)) redirect("/painel")
  return user
}

/**
 * Hierarquia: ninguém gerencia a si mesmo nem o superadmin;
 * admin gerencia só "user"; superadmin gerencia "user" e "admin".
 */
export function canManage(actor: Pick<CurrentUser, "id" | "role">, target: Pick<Profile, "id" | "role">) {
  if (actor.id === target.id || target.role === "superadmin") return false
  if (actor.role === "superadmin") return true
  return actor.role === "admin" && target.role === "user"
}

/** Ajuste de créditos: superadmin ajusta qualquer conta (inclusive a própria, para testes); admin só usuários comuns. */
export function canAdjustCredits(actor: Pick<CurrentUser, "id" | "role">, target: Pick<Profile, "id" | "role">) {
  if (actor.role === "superadmin") return true
  return actor.role === "admin" && target.role === "user" && actor.id !== target.id
}

export function canCreateRole(actor: Pick<CurrentUser, "role">, role: AppRole) {
  if (role === "superadmin") return false
  if (role === "admin") return actor.role === "superadmin"
  return hasRole(actor, "admin")
}
