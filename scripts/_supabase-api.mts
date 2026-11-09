// Helpers da Management API do Supabase (usado só por scripts locais).
const token = process.env.SUPABASE_ACCESS_TOKEN
const url = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!token || !url) {
  console.error("Defina SUPABASE_ACCESS_TOKEN e NEXT_PUBLIC_SUPABASE_URL no .env")
  process.exit(1)
}

export const projectRef = new URL(url).hostname.split(".")[0]
const base = `https://api.supabase.com/v1/projects/${projectRef}`

async function call(path: string, init: RequestInit) {
  const res = await fetch(base + path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${init.method} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

export function sql<T = Record<string, unknown>>(query: string): Promise<T[]> {
  return call("/database/query", { method: "POST", body: JSON.stringify({ query, read_only: false }) })
}

export function patchAuthConfig(body: Record<string, unknown>) {
  return call("/config/auth", { method: "PATCH", body: JSON.stringify(body) })
}

export function getAuthConfig() {
  return call("/config/auth", { method: "GET" })
}
