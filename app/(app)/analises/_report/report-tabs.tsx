"use client"

import { useSearchParams } from "next/navigation"
import { useState, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { NAV_ICONS } from "@/components/layout/nav-icons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { IconKey } from "@/lib/navigation"

export const REPORT_TABS = [
  { id: "diagnostico", label: "Diagnóstico", icon: "diagnosis" },
  { id: "estouros", label: "Vídeos que estouraram", icon: "outliers" },
  { id: "ritmo", label: "Melhor dia e ritmo", icon: "rhythm" },
  { id: "voz", label: "Seu jeito de falar", icon: "voice" },
] as const satisfies readonly { id: string; label: string; icon: IconKey }[]

export type ReportTabId = (typeof REPORT_TABS)[number]["id"]

const isTab = (v: string | null): v is ReportTabId => REPORT_TABS.some((t) => t.id === v)

/**
 * Abas do relatório. A aba ativa fica em `?aba=` (link direto, voltar do navegador), trocada sem ir ao
 * servidor: o conteúdo de todas as abas já veio renderizado e só a ativa é montada.
 */
export function ReportTabs({ panels }: { panels: Record<ReportTabId, ReactNode> }) {
  const params = useSearchParams()
  const fromUrl = params.get("aba")
  const [value, setValue] = useState<ReportTabId>(isTab(fromUrl) ? fromUrl : "diagnostico")
  // Link interno para outra aba (ex.: "Próximo passo") muda a URL: acompanha sem efeito.
  const [lastUrl, setLastUrl] = useState(fromUrl)
  if (fromUrl !== lastUrl) {
    setLastUrl(fromUrl)
    if (isTab(fromUrl)) setValue(fromUrl)
  }

  function change(next: unknown) {
    if (!isTab(next as string)) return
    setValue(next as ReportTabId)
    const url = new URL(window.location.href)
    url.searchParams.set("aba", next as string)
    window.history.replaceState(null, "", url)
  }

  return (
    <Tabs value={value} onValueChange={change}>
      <TabsList aria-label="Partes do relatório">
        {REPORT_TABS.map((t) => (
          <TabsTrigger key={t.id} value={t.id}>
            <HugeiconsIcon icon={NAV_ICONS[t.icon]} strokeWidth={1.75} />
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {REPORT_TABS.map((t) => (
        <TabsContent key={t.id} value={t.id}>
          {panels[t.id]}
        </TabsContent>
      ))}
    </Tabs>
  )
}
