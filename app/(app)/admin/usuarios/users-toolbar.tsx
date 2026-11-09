"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { roleLabel } from "@/lib/navigation"
import {
  buildUsersHref,
  ROLE_FILTERS,
  STATUS_FILTER_LABEL,
  STATUS_FILTERS,
  type UserFilters,
} from "./filters"

const ALL = "todos"

const roleItems = [{ value: ALL, label: "Todos os tipos" }, ...ROLE_FILTERS.map((r) => ({ value: r, label: roleLabel[r] }))]
const statusItems = [
  { value: ALL, label: "Todos os status" },
  ...STATUS_FILTERS.map((s) => ({ value: s, label: STATUS_FILTER_LABEL[s] })),
]

/** Busca (com debounce), filtros por tipo e status. Atualiza a URL; a página filtra no servidor. */
export function UsersToolbar({ filters }: { filters: UserFilters }) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState(filters.q)
  const lastPushed = useRef(filters.q)

  // Mantém o campo em sincronia quando a URL muda por fora (voltar/avançar, limpar).
  useEffect(() => {
    setQuery(filters.q)
    lastPushed.current = filters.q
  }, [filters.q])

  function navigate(patch: Partial<UserFilters>) {
    // Qualquer mudança de filtro volta para a página 1.
    const href = buildUsersHref(filters, { ...patch, pagina: 1 })
    startTransition(() => router.replace(href, { scroll: false }))
  }

  // Debounce da busca: 300ms depois de parar de digitar.
  useEffect(() => {
    const q = query.trim()
    if (q === lastPushed.current) return
    const id = setTimeout(() => {
      lastPushed.current = q
      navigate({ q })
    }, 300)
    return () => clearTimeout(id)
  }, [query])

  const hasFilters = Boolean(filters.q || filters.papel || filters.status)

  return (
    <div
      className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center"
      aria-busy={pending}
      data-pending={pending || undefined}
    >
      <div className="relative flex-1 sm:max-w-sm">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={1.75}
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou e-mail"
          aria-label="Buscar usuários por nome ou e-mail"
          className="pl-8"
          maxLength={100}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          items={roleItems}
          value={filters.papel ?? ALL}
          onValueChange={(v) => navigate({ papel: v && v !== ALL ? (v as UserFilters["papel"]) : undefined })}
        >
          <SelectTrigger aria-label="Filtrar por tipo de conta" className="min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={statusItems}
          value={filters.status ?? ALL}
          onValueChange={(v) => navigate({ status: v && v !== ALL ? (v as UserFilters["status"]) : undefined })}
        >
          <SelectTrigger aria-label="Filtrar por status" className="min-w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("")
              lastPushed.current = ""
              startTransition(() => router.replace(pathname, { scroll: false }))
            }}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-start" />
            Limpar filtros
          </Button>
        ) : null}
      </div>
    </div>
  )
}
