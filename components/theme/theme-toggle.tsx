"use client"

import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Alterna entre claro e escuro. Os dois ícones são renderizados e o CSS (classe .dark)
 * decide qual aparece, então não há divergência de hidratação.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Alternar tema claro/escuro"
          />
        }
      >
        <HugeiconsIcon icon={Sun03Icon} strokeWidth={1.5} className="hidden dark:block" />
        <HugeiconsIcon icon={Moon02Icon} strokeWidth={1.5} className="block dark:hidden" />
      </TooltipTrigger>
      <TooltipContent>
        <span className="hidden dark:inline">Tema claro</span>
        <span className="dark:hidden">Tema escuro</span>
      </TooltipContent>
    </Tooltip>
  )
}
