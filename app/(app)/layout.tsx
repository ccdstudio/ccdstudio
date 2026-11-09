import { Suspense } from "react"
import { AppSidebar, AppSidebarSkeleton } from "@/components/layout/app-sidebar"
import { PageTitle } from "@/components/layout/page-title"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"

// Área logada. A proteção real está no DAL (requireUser/requireRole) de cada página e action;
// a sidebar só mostra os menus permitidos para o papel do usuário.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Suspense fallback={<AppSidebarSkeleton />}>
        <AppSidebar />
      </Suspense>
      <SidebarInset className="min-w-0 bg-canvas">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-canvas/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1 rounded-full" />
          <Separator orientation="vertical" className="mr-2 self-center! data-[orientation=vertical]:h-4" />
          <PageTitle />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        {/* Container do Tailwind: acompanha a largura da tela até 1536px (2xl). */}
        <main className="container mx-auto flex min-w-0 flex-1 flex-col gap-8 px-4 py-8 sm:px-8 md:py-10">
          {children}
        </main>
      </SidebarInset>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  )
}
