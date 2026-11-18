"use client"

import { useSearchParams } from "next/navigation"
import { useState, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { NAV_ICONS } from "@/components/layout/nav-icons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { IconKey } from "@/lib/navigation"

export const VIDEO_TABS = [
  { id: "resumo", label: "Resumo", icon: "video" },
  { id: "otimizacao", label: "Título e SEO", icon: "optimize" },
  { id: "roteiro", label: "Roteiro", icon: "script" },
  { id: "thumbnail", label: "Thumbnail", icon: "thumbnail" },
] as const satisfies readonly { id: string; label: string; icon: IconKey }[]

export type VideoTabId = (typeof VIDEO_TABS)[number]["id"]

const isTab = (v: string | null): v is VideoTabId => VIDEO_TABS.some((t) => t.id === v)

/** Abas do Vídeo completo. A aba ativa fica em `?aba=`; todas já vêm renderizadas do servidor. */
export function VideoTabs({ panels }: { panels: Record<VideoTabId, ReactNode> }) {
  const params = useSearchParams()
  const fromUrl = params.get("aba")
  const [value, setValue] = useState<VideoTabId>(isTab(fromUrl) ? fromUrl : "resumo")
  const [lastUrl, setLastUrl] = useState(fromUrl)
  if (fromUrl !== lastUrl) {
    setLastUrl(fromUrl)
    if (isTab(fromUrl)) setValue(fromUrl)
  }

  function change(next: unknown) {
    if (!isTab(next as string)) return
    setValue(next as VideoTabId)
    const url = new URL(window.location.href)
    url.searchParams.set("aba", next as string)
    window.history.replaceState(null, "", url)
  }

  return (
    <Tabs value={value} onValueChange={change}>
      <TabsList aria-label="Partes do vídeo">
        {VIDEO_TABS.map((t) => (
          <TabsTrigger key={t.id} value={t.id}>
            <HugeiconsIcon icon={NAV_ICONS[t.icon]} strokeWidth={1.75} />
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {VIDEO_TABS.map((t) => (
        <TabsContent key={t.id} value={t.id}>
          {panels[t.id]}
        </TabsContent>
      ))}
    </Tabs>
  )
}
