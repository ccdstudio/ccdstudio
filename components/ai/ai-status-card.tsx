import { HugeiconsIcon } from "@hugeicons/react"
import { AiMagicIcon } from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { isAiConfigured } from "@/lib/ai/client"
import type { CurrentUser } from "@/lib/auth/dal"
import { env } from "@/lib/env"
import { STATUS_BADGE } from "@/lib/status-colors"
import { TestAiButton } from "./test-ai-button"

/** Estado da integração com a OpenAI (só superadmin). Mostra se a chave existe, nunca o valor. */
export function AiStatusCard({ user }: { user: CurrentUser }) {
  if (user.role !== "superadmin") return null
  const configured = isAiConfigured()

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-center gap-3 sm:w-56">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HugeiconsIcon icon={AiMagicIcon} strokeWidth={1.75} className="size-4" />
        </span>
        <div className="flex flex-col">
          <span className="label">Inteligência artificial</span>
          <span className="text-xs text-muted-foreground">Visível só para o superadmin</span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-2">
          <span className="text-muted-foreground">Chave da OpenAI</span>
          <Badge variant="outline" className={configured ? STATUS_BADGE.active : STATUS_BADGE.inactive}>
            {configured ? "Configurada" : "Ausente"}
          </Badge>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-muted-foreground">Modelo</span>
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">{env.OPENAI_MODEL}</code>
        </span>
      </div>

      <TestAiButton disabled={!configured} />
    </section>
  )
}
