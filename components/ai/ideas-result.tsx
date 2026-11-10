import type { z } from "zod"
import { CopyButton } from "@/components/shared/copy-button"
import { InfoHint } from "@/components/shared/info-hint"
import { Badge } from "@/components/ui/badge"
import type { ideasOutputSchema } from "@/lib/ai/prompts/ideas"

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })

type Props = { output: z.infer<typeof ideasOutputSchema>; createdAt: string }

/** As 3 próximas ideias geradas a partir dos estouros (usado em Vídeos que estouraram e no Histórico). */
export function IdeasResult({ output, createdAt }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="label flex items-center gap-1">
          Próximas ideias
          <InfoHint
            label="Próximas ideias"
            text="A IA olhou os seus vídeos que estouraram e sugeriu 3 vídeos no mesmo estilo, que dá para gravar esta semana. Revise antes de usar."
          />
        </span>
        <span className="text-xs text-muted-foreground">Geradas em {dateTime.format(new Date(createdAt))}</span>
      </div>
      <p className="text-sm">
        <strong className="font-semibold">Padrão:</strong> {output.padrao_em_comum}
      </p>
      <ul className="grid gap-3 lg:grid-cols-3">
        {output.ideias.map((idea) => (
          <li key={idea.titulo} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold">{idea.titulo}</span>
              <CopyButton text={idea.titulo} what="Título" label="" />
            </div>
            <p className="text-sm text-muted-foreground">{idea.promessa}</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">{idea.formato === "short" ? "Short" : "Longo"}</Badge>
              <Badge variant="outline">{idea.formula}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{idea.por_que}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        A fórmula é uma leitura das palavras do título, não a prova de por que o vídeo funcionou.
      </p>
    </div>
  )
}
