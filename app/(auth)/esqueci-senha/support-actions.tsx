"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buttonVariants } from "@/components/ui/button"
import { forgotPasswordMessage, mailtoLink, whatsappLink } from "@/lib/support"

export function SupportActions({ whatsapp, email }: { whatsapp: string; email: string }) {
  const [userEmail, setUserEmail] = useState("")
  const message = forgotPasswordMessage(userEmail.trim() || undefined)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Seu e-mail de acesso (opcional)</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
        />
      </div>
      <a
        href={whatsappLink(whatsapp, message)}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ size: "lg", className: "w-full" })}
      >
        Falar no WhatsApp
      </a>
      <a
        href={mailtoLink(email, "Esqueci minha senha", message)}
        className="self-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Ou envie um e-mail para {email}
      </a>
    </div>
  )
}
