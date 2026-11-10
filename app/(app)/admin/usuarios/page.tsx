import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { RoleBadge, StatusBadge } from "@/components/shared/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { canAdjustCredits, canManage, requireRole } from "@/lib/auth/dal"
import { createClient } from "@/lib/supabase/server"
import { AdjustCreditsDialog } from "./adjust-credits-form"
import { CreateUserDialog } from "./create-user-form"
import { PAGE_SIZE, parseUserFilters, sanitizeSearch, type UserFilters } from "./filters"
import { UserRowActions } from "./user-row-actions"
import { UsersPagination } from "./users-pagination"
import { UsersToolbar } from "./users-toolbar"

export const metadata: Metadata = { title: "Usuários · CCD Studio" }

const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" })

const HEADER = {
  eyebrow: "Visão geral",
  title: "Usuários",
  icon: "users" as const,
  help: "usuarios" as const,
}

const COLUMNS = 7

/** Busca paginada e filtrada no banco (RLS: admins leem todos os perfis). */
async function fetchUsers(filters: UserFilters) {
  const supabase = await createClient()
  let query = supabase
    .from("profiles")
    .select("id, name, email, role, is_active, must_change_password, created_at", { count: "exact" })

  const q = sanitizeSearch(filters.q)
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`)
  if (filters.papel) query = query.eq("role", filters.papel)
  if (filters.status === "ativo") query = query.eq("is_active", true)
  if (filters.status === "inativo") query = query.eq("is_active", false)
  if (filters.status === "temporaria") query = query.eq("must_change_password", true)

  const from = (filters.pagina - 1) * PAGE_SIZE
  return query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1)
}

async function UsersAdmin({ searchParams }: { searchParams: PageProps<"/admin/usuarios">["searchParams"] }) {
  const actor = await requireRole("admin")
  const filters = parseUserFilters(await searchParams)

  let { data: users, count, error } = await fetchUsers(filters)

  // Página além do fim (link antigo, ou o filtro reduziu o total): o PostgREST responde
  // PGRST103. Descobre o total pela 1ª página e mostra a última página válida.
  if (error?.code === "PGRST103" && filters.pagina > 1) {
    const first = await fetchUsers({ ...filters, pagina: 1 })
    filters.pagina = Math.max(1, Math.ceil((first.count ?? 0) / PAGE_SIZE))
    ;({ data: users, count, error } = filters.pagina === 1 ? first : await fetchUsers(filters))
  }

  const hasFilters = Boolean(filters.q || filters.papel || filters.status)

  // Saldo de créditos dos usuários da página (RLS: admins leem todos).
  const ids = (users ?? []).map((u) => u.id)
  const { data: balances } = ids.length
    ? await (await createClient()).from("credit_balances").select("user_id, free, purchased").in("user_id", ids)
    : { data: [] }
  const balanceOf = new Map((balances ?? []).map((b) => [b.user_id, b]))

  return (
    <>
      <PageHeader
        {...HEADER}
        description="Crie contas, ative ou desative acessos, redefina senhas e ajuste créditos."
        actions={<CreateUserDialog canCreateAdmin={actor.role === "superadmin"} />}
      />

      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
        <UsersToolbar filters={filters} />

        {error ? (
          <p className="p-6 text-sm text-destructive">Não foi possível carregar os usuários.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="label px-4">Nome</TableHead>
                  <TableHead className="label">E-mail</TableHead>
                  <TableHead className="label">Tipo</TableHead>
                  <TableHead className="label">Status</TableHead>
                  <TableHead className="label">Créditos</TableHead>
                  <TableHead className="label">Criado em</TableHead>
                  <TableHead className="label px-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="px-4 font-semibold">{u.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <StatusBadge status={u.is_active ? "active" : "inactive"} />
                          {u.must_change_password ? <StatusBadge status="temporaryPassword" /> : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums">
                        {(balanceOf.get(u.id)?.free ?? 0) + (balanceOf.get(u.id)?.purchased ?? 0)}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {dateFmt.format(new Date(u.created_at))}
                      </TableCell>
                      <TableCell className="px-4">
                        {canManage(actor, u) || canAdjustCredits(actor, u) ? (
                          <div className="flex justify-end gap-2">
                            {canAdjustCredits(actor, u) ? (
                              <AdjustCreditsDialog
                                userId={u.id}
                                name={u.name || u.email}
                                free={balanceOf.get(u.id)?.free ?? 0}
                                purchased={balanceOf.get(u.id)?.purchased ?? 0}
                              />
                            ) : null}
                            {canManage(actor, u) ? (
                              <UserRowActions id={u.id} name={u.name || u.email} isActive={u.is_active} />
                            ) : null}
                          </div>
                        ) : (
                          <span className="block text-right text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={COLUMNS} className="py-12 text-center">
                      <p className="font-semibold">Nenhum usuário encontrado</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {hasFilters ? "Ajuste a busca ou limpe os filtros." : "Crie o primeiro usuário pelo botão acima."}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <UsersPagination filters={filters} total={count ?? 0} />
          </>
        )}
      </div>
    </>
  )
}

export default function UsersPage({ searchParams }: PageProps<"/admin/usuarios">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader {...HEADER} description="Carregando usuários…" />
          <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
        </>
      }
    >
      <UsersAdmin searchParams={searchParams} />
    </Suspense>
  )
}
