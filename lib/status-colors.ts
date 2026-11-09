import type { AppRole } from "@/lib/supabase/database.types"

// Cores de domínio em um só lugar (DESIGN.md): paleta padrão do Tailwind em tons suaves
// — fundo 100 / texto 700-800 no claro; fundo 500/15 / texto 300 no escuro.
// Use com <Badge variant="outline" className={...}> ou em pontos/barras (tons 400/500).

const tone = {
  blue: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  indigo: "border-transparent bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300",
  slate: "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  emerald: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  red: "border-transparent bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  amber: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
} as const

/** Papéis: superadmin no azul da marca, admin em índigo (marinho), usuário em neutro. */
export const ROLE_BADGE: Record<AppRole, string> = {
  superadmin: tone.blue,
  admin: tone.indigo,
  user: tone.slate,
}

export const STATUS_BADGE = {
  active: tone.emerald,
  inactive: tone.red,
  temporaryPassword: tone.amber,
} as const

/** Ponto colorido do status (tons 400/500). */
export const STATUS_DOT: Record<keyof typeof STATUS_BADGE, string> = {
  active: "bg-emerald-500",
  inactive: "bg-red-500",
  temporaryPassword: "bg-amber-500",
}
