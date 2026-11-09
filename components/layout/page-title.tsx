"use client"

import { usePathname } from "next/navigation"
import { getPageTitle } from "@/lib/navigation"

export function PageTitle() {
  return <span className="truncate text-sm font-semibold">{getPageTitle(usePathname())}</span>
}
