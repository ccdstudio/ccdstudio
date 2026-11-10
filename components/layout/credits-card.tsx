"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { CoinsDollarIcon } from "@hugeicons/core-free-icons"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type CreditsCardProps = { free: number; purchased: number; nextReset: string; low: boolean }

/** Saldo de créditos sempre visível na sidebar; leva a Planos e créditos (saldo + extrato). */
export function CreditsCard({ free, purchased, nextReset, low }: CreditsCardProps) {
  const total = free + purchased
  const detail = `${free} gratuitos · ${purchased} comprados · renova em ${nextReset}`

  return (
    <div>
      <Link
        href="/conta/planos"
        aria-label={`${total} créditos. Ver saldo e extrato`}
        className={cn(
          "flex flex-col gap-1 rounded-xl border p-3 outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:hidden",
          low ? "border-amber-300/40 bg-amber-400/10" : "border-sidebar-border bg-sidebar-accent/50"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="label text-sidebar-foreground/60">Créditos</span>
          <HugeiconsIcon
            icon={CoinsDollarIcon}
            strokeWidth={1.75}
            className={cn("size-4", low ? "text-amber-300" : "text-sidebar-foreground/60")}
          />
        </div>
        <p className="font-heading text-2xl font-extrabold tracking-[-0.03em] tabular-nums">{total}</p>
        <p className="text-xs text-sidebar-foreground/60">
          {low ? "Saldo baixo. " : ""}Renova em {nextReset}
        </p>
        {purchased > 0 ? (
          <p className="text-xs text-sidebar-foreground/60 tabular-nums">
            {free} gratuitos · {purchased} comprados
          </p>
        ) : null}
      </Link>

      <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
        <SidebarMenuItem>
          <SidebarMenuButton
            render={<Link href="/conta/planos" />}
            tooltip={`${total} créditos (${detail})`}
            className={cn("rounded-full tabular-nums", low && "text-amber-300")}
            aria-label={`${total} créditos`}
          >
            <HugeiconsIcon icon={CoinsDollarIcon} strokeWidth={1.75} />
            <span>{total}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  )
}
