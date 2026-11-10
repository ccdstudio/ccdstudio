import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { NoteEditIcon, SparklesIcon } from "@hugeicons/core-free-icons"
import { Button, buttonVariants } from "@/components/ui/button"

const ICONS = { sparkles: SparklesIcon, script: NoteEditIcon } as const

/** Botão que leva ao formulário em etapas de uma geração com IA (/criar/…/nova). Desabilitado vira botão inerte. */
export function NewGenerationLink({
  href,
  label,
  icon = "sparkles",
  disabled,
}: {
  href: string
  label: string
  icon?: keyof typeof ICONS
  disabled?: boolean
}) {
  const content = (
    <>
      <HugeiconsIcon icon={ICONS[icon]} strokeWidth={1.75} data-icon="inline-start" />
      {label}
    </>
  )
  if (disabled) return <Button disabled>{content}</Button>
  return (
    <Link href={href} className={buttonVariants()}>
      {content}
    </Link>
  )
}
