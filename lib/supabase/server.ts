import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { connection } from "next/server"
import type { Database } from "./database.types"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./public-env"

// Cliente com a sessão do usuário (respeita RLS).
export async function createClient() {
  // Sessão é sempre dado de requisição: o Supabase lê o relógio (Date.now) para validar
  // a expiração do token, o que o Cache Components não permite durante o prerender.
  await connection()
  const cookieStore = await cookies()

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options)
        } catch {
          // Chamado de um Server Component: o proxy cuida de renovar a sessão.
        }
      },
    },
  })
}
