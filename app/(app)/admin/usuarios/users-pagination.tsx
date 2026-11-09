import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { buildUsersHref, PAGE_SIZE, type UserFilters } from "./filters"

/** Páginas visíveis: primeira, última e vizinhas da atual, com reticências nos saltos. */
function pageWindow(current: number, total: number): (number | "…")[] {
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out: (number | "…")[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…")
    out.push(p)
  })
  return out
}

export function UsersPagination({ filters, total }: { filters: UserFilters; total: number }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(filters.pagina, totalPages)
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="flex flex-col items-center gap-3 border-t border-border px-4 py-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground tabular-nums">
        {total === 0 ? "Nenhum resultado" : `Mostrando ${from}–${to} de ${total}`}
      </p>
      {totalPages > 1 ? (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={buildUsersHref(filters, { pagina: page - 1 })}
                aria-disabled={page === 1}
                tabIndex={page === 1 ? -1 : undefined}
                className={page === 1 ? "pointer-events-none opacity-50" : undefined}
                scroll={false}
              />
            </PaginationItem>
            {pageWindow(page, totalPages).map((p, i) =>
              p === "…" ? (
                <PaginationItem key={`e${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink href={buildUsersHref(filters, { pagina: p })} isActive={p === page} scroll={false}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href={buildUsersHref(filters, { pagina: page + 1 })}
                aria-disabled={page === totalPages}
                tabIndex={page === totalPages ? -1 : undefined}
                className={page === totalPages ? "pointer-events-none opacity-50" : undefined}
                scroll={false}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}
