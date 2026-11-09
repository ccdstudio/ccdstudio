"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Logout01Icon, UnfoldMoreIcon, UserCircleIcon } from "@hugeicons/core-free-icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import type { AppRole } from "@/lib/supabase/database.types"
import { roleLabel } from "@/lib/navigation"

type NavUserProps = { user: { name: string; email: string; role: AppRole } }

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return email.slice(0, 2).toUpperCase()
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

function Identity({ user, inSidebar = false }: NavUserProps & { inSidebar?: boolean }) {
  return (
    <>
      <Avatar className="size-8 rounded-full">
        <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
          {initials(user.name, user.email)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left leading-tight">
        <span className="truncate text-sm font-semibold">{user.name || user.email}</span>
        <span className={inSidebar ? "truncate text-xs text-sidebar-foreground/60" : "truncate text-xs text-muted-foreground"}>
          {roleLabel[user.role]}
        </span>
      </div>
    </>
  )
}

export function NavUser({ user, alert = false }: NavUserProps & { alert?: boolean }) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="rounded-xl data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <Identity user={user} inSidebar />
            <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={1.5} className="ml-auto size-4 text-sidebar-foreground/60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
            className="min-w-60"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2 p-1.5 font-normal">
                <Identity user={user} />
              </DropdownMenuLabel>
              <p className="truncate px-1.5 pb-1.5 text-xs text-muted-foreground">{user.email}</p>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/perfil" />}>
              <HugeiconsIcon icon={UserCircleIcon} strokeWidth={1.5} />
              Perfil
              {alert ? <span className="ml-auto size-2 rounded-full bg-amber-400" aria-label="Troque sua senha" /> : null}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action="/auth/sair" method="post">
              <DropdownMenuItem nativeButton render={<button type="submit" className="w-full" />}>
                <HugeiconsIcon icon={Logout01Icon} strokeWidth={1.5} />
                Sair
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
