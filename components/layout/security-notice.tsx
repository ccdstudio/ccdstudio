"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { SecurityLockIcon } from "@hugeicons/core-free-icons"
import { buttonVariants } from "@/components/ui/button"
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

const HREF = "/perfil#seguranca"

/**
 * Aviso persistente na sidebar enquanto a conta usa senha temporária.
 * Some quando `must_change_password` vira false (após a troca no Perfil).
 */
export function SecurityNotice() {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const close = () => isMobile && setOpenMobile(false)

  return (
    <SidebarGroup className="mt-auto">
      {/* Expandida: card de alerta em âmbar */}
      <div
        role="status"
        className="flex flex-col gap-2.5 rounded-xl border border-amber-300/40 bg-amber-400/10 p-3 group-data-[collapsible=icon]:hidden"
      >
        <div className="flex items-center gap-2 text-amber-300">
          <HugeiconsIcon icon={SecurityLockIcon} strokeWidth={1.75} className="size-4" />
          <span className="text-sm font-semibold">Troque sua senha</span>
        </div>
        <p className="text-xs leading-relaxed text-sidebar-foreground/75">
          Você está usando uma senha temporária. Por segurança, defina uma senha pessoal.
        </p>
        {pathname !== "/perfil" ? (
          <Link href={HREF} onClick={close} className={buttonVariants({ size: "sm", className: "w-full" })}>
            Alterar agora
          </Link>
        ) : null}
      </div>

      {/* Recolhida: só o ícone, com tooltip */}
      <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Troque sua senha por segurança"
            className="rounded-full text-amber-300"
            render={<Link href={HREF} onClick={close} aria-label="Troque sua senha por segurança" />}
          >
            <HugeiconsIcon icon={SecurityLockIcon} strokeWidth={1.75} />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
