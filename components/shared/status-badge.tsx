import { roleLabel } from "@/lib/navigation"
import { ROLE_BADGE, STATUS_BADGE, STATUS_DOT } from "@/lib/status-colors"
import type { AppRole } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"

const PILL = "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap"

/** Papel do usuário em pílula mono/caixa alta (cores em lib/status-colors.ts). */
export function RoleBadge({ role, className }: { role: AppRole; className?: string }) {
  return (
    <span className={cn(PILL, "font-mono tracking-[0.06em] uppercase", ROLE_BADGE[role], className)}>
      {roleLabel[role]}
    </span>
  )
}

type Status = keyof typeof STATUS_BADGE

const STATUS_LABEL: Record<Status, string> = {
  active: "Ativo",
  inactive: "Inativo",
  temporaryPassword: "Senha temporária",
}

/** Status em pílula com ponto colorido. */
export function StatusBadge({ status, label, className }: { status: Status; label?: string; className?: string }) {
  return (
    <span className={cn(PILL, STATUS_BADGE[status], className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {label ?? STATUS_LABEL[status]}
    </span>
  )
}
