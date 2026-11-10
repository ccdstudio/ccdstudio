import type { AppRole } from "@/lib/supabase/database.types"

// Fonte única dos menus da área logada. A filtragem por papel roda no servidor
// (components/layout/app-sidebar.tsx), então o client só recebe o que pode ver.
// Para liberar uma tela nova: crie a rota e remova `soon`.

export type IconKey =
  | "dashboard"
  | "optimize"
  | "script"
  | "thumbnail"
  | "shorts"
  | "chapters"
  | "history"
  | "calendar"
  | "profile"
  | "channel"
  | "diagnosis"
  | "outliers"
  | "rhythm"
  | "voice"
  | "billing"
  | "users"

export type NavItem = {
  title: string
  href: string
  icon: IconKey
  minRole?: AppRole
  soon?: boolean
}

export type NavGroup = {
  label: string
  minRole?: AppRole
  items: NavItem[]
}

const navigation: NavGroup[] = [
  {
    label: "Visão geral",
    items: [
      { title: "Painel", href: "/painel", icon: "dashboard" },
      // Só admin e superadmin veem (filtrado no servidor por getNavigation).
      { title: "Usuários", href: "/admin/usuarios", icon: "users", minRole: "admin" },
    ],
  },
  {
    label: "Conta",
    items: [
      { title: "Perfil", href: "/perfil", icon: "profile" },
      { title: "Meu canal", href: "/meu-canal", icon: "channel" },
      { title: "Planos e créditos", href: "/conta/planos", icon: "billing" },
    ],
  },
  {
    // Funcionalidades que usam os dados do canal + regras da skill + IA (cada uma numa página).
    label: "Análises do canal",
    items: [
      { title: "Diagnóstico do canal", href: "/analises/diagnostico", icon: "diagnosis" },
      { title: "Vídeos que estouraram", href: "/analises/estouros", icon: "outliers" },
      { title: "Melhor dia e ritmo", href: "/analises/ritmo", icon: "rhythm" },
      { title: "Seu jeito de falar", href: "/analises/voz", icon: "voice" },
    ],
  },
  {
    label: "Criar",
    items: [
      { title: "Otimização de vídeo", href: "/criar/otimizacao", icon: "optimize" },
      { title: "Roteiro", href: "/criar/roteiro", icon: "script" },
      { title: "Thumbnail", href: "/criar/thumbnail", icon: "thumbnail", soon: true },
      { title: "Shorts", href: "/criar/shorts", icon: "shorts", soon: true },
      { title: "Capítulos", href: "/criar/capitulos", icon: "chapters", soon: true },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { title: "Histórico", href: "/historico", icon: "history" },
      { title: "Calendário editorial", href: "/calendario", icon: "calendar", soon: true },
    ],
  },
]

const rank: Record<AppRole, number> = { user: 0, admin: 1, superadmin: 2 }
const allowed = (role: AppRole, min?: AppRole) => !min || rank[role] >= rank[min]

export function getNavigation(role: AppRole): NavGroup[] {
  return navigation
    .filter((group) => allowed(role, group.minRole))
    .map((group) => ({ ...group, items: group.items.filter((item) => allowed(role, item.minRole)) }))
    .filter((group) => group.items.length > 0)
}

/** Título da seção para o header, a partir do pathname. */
export function getPageTitle(pathname: string) {
  for (const group of navigation) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return item.title
    }
  }
  return "CCD Studio"
}

export const roleLabel: Record<AppRole, string> = { superadmin: "Super admin", admin: "Admin", user: "Usuário" }
