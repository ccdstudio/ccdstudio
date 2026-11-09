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
import { getNavigation } from "@/lib/navigation"
import { BrandIcon } from "./brand"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { SecurityNotice } from "./security-notice"

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

/**
 * Sidebar da área logada. Lê o usuário no servidor e entrega ao client
 * apenas os menus permitidos para o papel dele.
 */
export async function AppSidebar() {
  const user = await requireUser()
  const groups = getNavigation(user.role)
  const mustChangePassword = user.must_change_password

  return (
    <Shell
      footer={
        <NavUser user={{ name: user.name, email: user.email, role: user.role }} alert={mustChangePassword} />
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
