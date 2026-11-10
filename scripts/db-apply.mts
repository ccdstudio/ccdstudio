// Aplica as migrations de supabase/migrations que ainda não rodaram e a config de Auth.
// Uso: npm run db:apply
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { patchAuthConfig, projectRef, sql } from "./_supabase-api.mts"

const dir = join(import.meta.dirname, "..", "supabase", "migrations")

await sql(`
  create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (
    version text primary key, statements text[], name text
  );
`)

const applied = new Set(
  (await sql<{ version: string }>("select version from supabase_migrations.schema_migrations")).map((r) => r.version),
)

const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()
console.log(`Projeto ${projectRef}: ${files.length} migration(s), ${applied.size} já aplicada(s).`)

for (const file of files) {
  const [version, ...rest] = file.replace(/\.sql$/, "").split("_")
  if (applied.has(version)) continue
  const body = await readFile(join(dir, file), "utf8")
  const name = rest.join("_").replace(/'/g, "''")
  // Migration + registro na mesma transação
  await sql(`begin;\n${body}\ninsert into supabase_migrations.schema_migrations (version, name) values ('${version}', '${name}');\ncommit;`)
  console.log(`✓ ${file}`)
}

// Auth: sem cadastro público (só admins criam contas) e senha mínima de 8.
await patchAuthConfig({ disable_signup: true, password_min_length: 8 })
console.log("✓ Auth: cadastro público desativado, senha mínima 8")

// Login com Google (docs/GOOGLE-LOGIN-PASSO-A-PASSO.md). O cadastro continua fechado:
// só entra quem já tem conta com o mesmo e-mail (o Supabase vincula a identidade Google).
const googleId = process.env.GOOGLE_CLIENT_ID
const googleSecret = process.env.GOOGLE_CLIENT_SECRET
if (googleId && googleSecret) {
  await patchAuthConfig({
    external_google_enabled: true,
    external_google_client_id: googleId,
    external_google_secret: googleSecret,
    uri_allow_list: "http://localhost:3000/auth/callback,http://localhost:3000/**",
  })
  console.log("✓ Auth: Google ativado (retorno em http://localhost:3000/auth/callback)")
} else {
  console.log("• Auth: Google não configurado (defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET)")
}
