import "server-only"
import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import type { Database } from "./database.types"

// Service role: ignora RLS. Usar SOMENTE depois de checar o papel no servidor (lib/auth/dal.ts).
export function createAdminClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
