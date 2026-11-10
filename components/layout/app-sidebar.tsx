import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@/components/ui/sidebar"
import { requireUser } from "@/lib/auth/dal"
import { createClient } from "@/lib/supabase/server"
import { getCreditBalance, LOW_CREDITS } from "@/lib/credits/balance"
import { getNavigation } from "@/lib/navigation"
import { BrandIcon } from "./brand"
import { CreditsCard } from "./credits-card"
import { NavUser } from "./nav-user"
import { NavMain } from "./nav-main"
import { SecurityNotice } from "./security-notice"

const resetFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" })

function SidebarBrand() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="rounded-xl" render={<Link href="/painel" />}>
            {/* Ícone da marca sobre fundo branco, para destacar no menu marinho. */}
            <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-[10px] bg-white">
              <BrandIcon className="dark:invert-0" />
            </span>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-heading text-[15px] font-extrabold tracking-[-0.03em]">CCD Studio</span>
              <span className="truncate text-xs text-sidebar-foreground/60">AM Educação</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}

function Shell({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarBrand />
      <SidebarContent>{children}</SidebarContent>
      <SidebarFooter>{footer}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

/** Menu do usuário na topbar (lê o usuário e o canal vinculado no servidor). */
export async function TopbarUser() {
  const user = await requireUser()
  let channel: { title: string; thumbnail_url: string | null } | null = null
  if (user.youtube_channel_id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("youtube_channels")
      .select("title, thumbnail_url")
      .eq("id", user.youtube_channel_id)
      .maybeSingle()
    channel = data
  }
  return (
    <NavUser
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        channelTitle: channel?.title ?? null,
        avatarUrl: channel?.thumbnail_url ?? null,
      }}
      alert={user.must_change_password}
    />
  )
}

/**
 * Sidebar da área logada. Lê o usuário no servidor e entrega ao client
 * apenas os menus permitidos para o papel dele.
 */
export async function AppSidebar() {
  const user = await requireUser()
  const groups = getNavigation(user.role)
  const mustChangePassword = user.must_change_password
  const credits = await getCreditBalance(user.id)

  return (
    <Shell
      footer={
        <CreditsCard
          free={credits.free}
          purchased={credits.purchased}
          nextReset={resetFmt.format(credits.nextResetAt)}
          low={credits.total <= LOW_CREDITS}
        />
      }
    >
      <NavMain groups={groups} alerts={mustChangePassword ? { "/perfil": "troque sua senha" } : undefined} />
      {mustChangePassword ? <SecurityNotice /> : null}
    </Shell>
  )
}

export function AppSidebarSkeleton() {
  return (
    <Shell footer={<SidebarMenuSkeleton showIcon />}>
      <SidebarGroup>
        <SidebarMenu>
          {["60%", "80%", "70%", "85%", "55%", "75%"].map((width, i) => (
            <SidebarMenuItem key={i}>
              <SidebarMenuSkeleton showIcon width={width} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </Shell>
  )
}
