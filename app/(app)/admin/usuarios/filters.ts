import { z } from "zod"

// Filtros da lista de usuários, guardados na URL (?q=&papel=&status=&pagina=).
// Tudo que vem da URL é validado; valor inválido cai no padrão.

export const PAGE_SIZE = 10

export const ROLE_FILTERS = ["superadmin", "admin", "user"] as const
export const STATUS_FILTERS = ["ativo", "inativo", "temporaria"] as const

export type RoleFilter = (typeof ROLE_FILTERS)[number]
export type StatusFilter = (typeof STATUS_FILTERS)[number]

export const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  temporaria: "Senha temporária",
}

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v)

const schema = z.object({
  q: z.preprocess(first, z.string().trim().max(100).catch("")).default(""),
  papel: z.preprocess(first, z.enum(ROLE_FILTERS).optional().catch(undefined)),
  status: z.preprocess(first, z.enum(STATUS_FILTERS).optional().catch(undefined)),
  pagina: z.preprocess(first, z.coerce.number().int().min(1).max(10_000).catch(1)).default(1),
})

export type UserFilters = z.infer<typeof schema>

export function parseUserFilters(params: Record<string, string | string[] | undefined>): UserFilters {
  return schema.parse(params)
}

/** Remove caracteres com significado na sintaxe de filtro do PostgREST (`,` `(` `)`) e curingas. */
export function sanitizeSearch(q: string) {
  return q.replace(/[%_*,()\\]/g, " ").replace(/\s+/g, " ").trim()
}

/** Monta a query string mantendo os filtros atuais e trocando só o que for passado. */
export function buildUsersHref(filters: Partial<UserFilters>, patch: Partial<UserFilters> = {}) {
  const next = { ...filters, ...patch }
  const params = new URLSearchParams()
  if (next.q) params.set("q", next.q)
  if (next.papel) params.set("papel", next.papel)
  if (next.status) params.set("status", next.status)
  if (next.pagina && next.pagina > 1) params.set("pagina", String(next.pagina))
  const qs = params.toString()
  return qs ? `/admin/usuarios?${qs}` : "/admin/usuarios"
}
