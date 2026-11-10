"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { InformationCircleIcon, Video01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PAGE_HELP, youtubeEmbedUrl, type HelpKey, type PageHelp as Help } from "@/lib/help/pages"

const LABEL = "Como funciona esta página"

/**
 * Botão de info (quadrado) no banner da página: abre um modal com o vídeo da feature e o "Como funciona".
 * Nunca abre sozinho. O vídeo (iframe) só é montado com o modal aberto, então para ao fechar.
 */
export function PageHelp({ help }: { help: HelpKey }) {
  const page: Help = PAGE_HELP[help]
  const embed = youtubeEmbedUrl(page.video)

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  aria-label={LABEL}
                  className="size-14 shrink-0 rounded-xl bg-card p-0 text-primary [&_svg:not([class*='size-'])]:size-7"
                />
              }
            />
          }
        >
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={1.5} />
        </TooltipTrigger>
        <TooltipContent>{LABEL}</TooltipContent>
      </Tooltip>

      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Como funciona: {page.title}</DialogTitle>
          <DialogDescription>Um vídeo curto e o resumo do que dá para fazer aqui.</DialogDescription>
        </DialogHeader>

        {embed ? (
          <iframe
            src={embed}
            title={`Vídeo: ${page.title}`}
            className="aspect-video w-full rounded-xl border border-border bg-muted"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
            allowFullScreen
          />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground">
            <HugeiconsIcon icon={Video01Icon} strokeWidth={1.5} className="size-8" />
            <span className="text-sm font-medium">Vídeo em breve</span>
          </div>
        )}

        <dl className="flex flex-col gap-4">
          {[
            { label: "O que é", value: page.whatIs },
            { label: "Como usar", value: page.howToUse },
            { label: "De onde vêm os dados", value: page.dataSource },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <dt className="label">{item.label}</dt>
              <dd className="leading-relaxed text-muted-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  )
}
