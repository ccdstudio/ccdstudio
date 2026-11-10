"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Logout01Icon, UserCircleIcon } from "@hugeicons/core-free-icons"
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
import type { AppRole } from "@/lib/supabase/database.types"
import { roleLabel } from "@/lib/navigation"

type NavUserProps = { user: { name: string; email: string; role: AppRole } }

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return email.slice(0, 2).toUpperCase()
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

function UserAvatar({ user }: NavUserProps) {
  return (
    <Avatar className="size-8 rounded-full">
      <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
        {initials(user.name, user.email)}
      </AvatarFallback>
    </Avatar>
  )
}

/** Menu do usuário na direita da topbar: avatar + nome (desktop), Perfil e Sair. */
export function NavUser({ user, alert = false }: NavUserProps & { alert?: boolean }) {
  const label = user.name || user.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex items-center gap-2 rounded-full py-1 pr-2 pl-1 outline-none transition-colors hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-foreground/5"
        aria-label={`Menu de ${label}`}
      >
        <UserAvatar user={user} />
        <span className="hidden max-w-40 flex-col text-left leading-tight md:flex">
          <span className="truncate text-sm font-semibold">{label}</span>
          <span className="truncate text-xs text-muted-foreground">{roleLabel[user.role]}</span>
        </span>
        <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={1.75} className="hidden size-4 text-muted-foreground md:block" />
        {alert ? (
          <span className="absolute top-1 left-7 size-2.5 rounded-full bg-amber-400 ring-2 ring-canvas" aria-label="Troque sua senha" />
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" sideOffset={8} className="min-w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2 p-1.5 font-normal">
            <UserAvatar user={user} />
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-sm font-semibold text-foreground">{label}</span>
              <span className="truncate text-xs text-muted-foreground">{roleLabel[user.role]}</span>
            </div>
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
  )
}
