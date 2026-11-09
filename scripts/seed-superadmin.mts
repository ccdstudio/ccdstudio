// Cria (ou garante) o superadmin. Credenciais só via ambiente, no momento de rodar:
//   SEED_NAME="..." SEED_EMAIL="..." SEED_PASSWORD="..." npm run seed:superadmin
// A senha é enviada ao Supabase Auth, que a armazena com bcrypt.
import { createClient } from "@supabase/supabase-js"

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SECRET_KEY: secret, SEED_NAME, SEED_EMAIL, SEED_PASSWORD } = process.env
if (!url || !secret || !SEED_EMAIL || !SEED_PASSWORD) {
  console.error("Faltam variáveis: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, SEED_EMAIL, SEED_PASSWORD")
  process.exit(1)
}

const email = SEED_EMAIL.trim().toLowerCase()
const name = SEED_NAME?.trim() || "Super Admin"
const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })

let userId: string | undefined
const created = await supabase.auth.admin.createUser({
  email,
  password: SEED_PASSWORD,
  email_confirm: true,
  user_metadata: { name },
})

if (created.error) {
  if (created.error.code !== "email_exists") throw created.error
  const { data } = await supabase.from("profiles").select("id").eq("email", email).single()
  userId = data?.id
  console.log("Usuário já existia; garantindo papel de superadmin.")
} else {
  userId = created.data.user.id
  console.log("Usuário criado.")
}
if (!userId) throw new Error("Não foi possível obter o id do usuário")

const { error } = await supabase
  .from("profiles")
  .update({ role: "superadmin", name, is_active: true, must_change_password: false })
  .eq("id", userId)
if (error) throw error

console.log(`✓ Superadmin: ${name} <${email}>`)
