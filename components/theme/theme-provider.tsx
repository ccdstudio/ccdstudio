"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"

// Tema claro/escuro. Padrão: escuro (o "darkroom" do DESIGN.md).
// A escolha fica salva no navegador (localStorage) e é aplicada antes da pintura,
// sem flash, via script injetado pelo next-themes.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider>{children}</TooltipProvider>
    </NextThemesProvider>
  )
}
