import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import { Brand } from "@/components/layout/brand"
import { ThemeToggle } from "@/components/theme/theme-toggle"

const BENEFITS = [
  ["Roteiros e metadados.", "Títulos, descrições e tags prontos para o YouTube."],
  ["Thumbnails e cortes.", "Thumbnails, shorts e capítulos gerados a partir do vídeo."],
  ["Conta segura.", "Acesso criado pelo administrador, com dados isolados por usuário."],
]

// Telas de acesso: formulário à esquerda, painel escuro de marca à direita (desktop).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh flex-1 lg:grid-cols-[1fr_minmax(0,560px)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Brand />
          <ThemeToggle />
        </div>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 py-12">{children}</main>
      </div>
      <aside className="m-3 hidden flex-col justify-between rounded-[20px] bg-[linear-gradient(rgb(17,17,17)_24%,rgb(0,0,0))] p-12 text-white lg:flex">
        <span className="font-heading text-xl font-extrabold tracking-[-0.03em]">CCD Studio</span>
        <div className="flex flex-col gap-8">
          <h2 className="text-5xl leading-[1.1] font-bold tracking-[-0.04em]">
            Conteúdo para YouTube com IA, do roteiro à thumbnail.
          </h2>
          <ul className="flex flex-col gap-3">
            {BENEFITS.map(([title, description]) => (
              <li key={title} className="flex items-start gap-3 text-[15px]">
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.25} className="mt-0.5 size-[18px] shrink-0 text-blue-400" />
                <span>
                  <strong className="font-semibold text-white">{title}</strong>{" "}
                  <span className="text-white/60">{description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <span className="text-xs text-white/50">© AM Educação · CCD Studio</span>
      </aside>
    </div>
  )
}
