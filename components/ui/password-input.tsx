"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons"
import { cn } from "cn"
import { Input } from "@/components/ui/input"

// Input de senha com botão para mostrar/ocultar (DESIGN.md: linha inferior, ação inline à direita).
function PasswordInput({ className, ...props }: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-10", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
        aria-controls={props.id}
        title={visible ? "Ocultar senha" : "Mostrar senha"}
        className="absolute inset-y-0 right-0 flex w-9 items-center rounded-r-lg justify-center text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <HugeiconsIcon icon={visible ? ViewOffSlashIcon : ViewIcon} strokeWidth={1.5} className="size-4" />
      </button>
    </div>
  )
}

export { PasswordInput }
