import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, Image01Icon, NoteEditIcon, SparklesIcon, Video01Icon } from "@hugeicons/core-free-icons"
import { Button, buttonVariants } from "@/components/ui/button"

const ICONS = { sparkles: SparklesIcon, script: NoteEditIcon, calendar: Calendar03Icon, image: Image01Icon, video: Video01Icon } as const

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
      {/* Ícone desconhecido cai no padrão em vez de quebrar a página. */}
      <HugeiconsIcon icon={ICONS[icon] ?? SparklesIcon} strokeWidth={1.75} data-icon="inline-start" />
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
