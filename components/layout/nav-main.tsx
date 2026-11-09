"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { NavGroup } from "@/lib/navigation"
import { NAV_ICONS } from "./nav-icons"

// Item do menu em pílula; ativo em azul (sidebar-primary) sobre o marinho.
const MENU_BUTTON =
  "rounded-full px-3 font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-primary data-active:font-semibold data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground"

export function NavMain({ groups, alerts = {} }: { groups: NavGroup[]; alerts?: Partial<Record<string, string>> }) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel className="font-mono text-[10px] tracking-[0.08em] text-sidebar-foreground/55 uppercase">
            {group.label}
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {group.items.map((item) => {
              const icon = <HugeiconsIcon icon={NAV_ICONS[item.icon]} strokeWidth={1.75} />

              if (item.soon) {
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      aria-disabled
                      tooltip={`${item.title} · em breve`}
                      className={`${MENU_BUTTON} cursor-default opacity-60`}
                    >
                      {icon}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-sidebar-accent px-1.5 py-0.5 font-mono text-[9px] tracking-[0.06em] text-sidebar-foreground/70 uppercase group-data-[collapsible=icon]:hidden">
                      Em breve
                    </span>
                  </SidebarMenuItem>
                )
              }

              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const alert = alerts[item.href]
              return (
                <SidebarMenuItem key={item.href}>
                  {alert ? (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-1.5 left-6 z-10 size-2 rounded-full bg-amber-400 ring-2 ring-sidebar"
                    />
                  ) : null}
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={alert ? `${item.title} · ${alert}` : item.title}
                    aria-description={alert}
                    className={MENU_BUTTON}
                    render={
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => isMobile && setOpenMobile(false)}
                      />
                    }
                  >
                    {icon}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
