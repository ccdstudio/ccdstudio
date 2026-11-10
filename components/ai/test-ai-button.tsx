"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon, Plug01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { testAiConnection, type AiTestResult } from "@/lib/ai/actions"

const number = new Intl.NumberFormat("pt-BR")

export function TestAiButton({ disabled }: { disabled?: boolean }) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<AiTestResult | null>(null)

  function run() {
    startTransition(async () => {
      const r = await testAiConnection()
      setResult(r)
      if (r.ok) toast.success(`OpenAI respondeu em ${(r.ms / 1000).toFixed(1)}s.`)
      else toast.error(r.message)
    })
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <Button variant="outline" size="sm" onClick={run} disabled={disabled || pending}>
        <HugeiconsIcon
          icon={pending ? Loading03Icon : Plug01Icon}
          strokeWidth={1.75}
          className={pending ? "animate-spin" : undefined}
          data-icon="inline-start"
        />
        {pending ? "Testando…" : "Testar conexão"}
      </Button>
      {result ? (
        <p role="status" className="text-xs text-muted-foreground tabular-nums sm:text-right">
          {result.ok
            ? `OK · ${result.model} · ${(result.ms / 1000).toFixed(1)}s · ${number.format(result.inputTokens)} + ${number.format(result.outputTokens)} tokens`
            : result.message}
        </p>
      ) : null}
    </div>
  )
}
