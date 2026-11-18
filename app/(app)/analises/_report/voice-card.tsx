import Link from "next/link"
import { DataList } from "@/components/shared/data-list"
import { SectionCard } from "@/components/shared/section-card"
import { Badge } from "@/components/ui/badge"
import { EditVoiceDialog, GenerateVoiceButton } from "@/components/ai/voice-forms"
import { isAiConfigured } from "@/lib/ai/client"
import { getVoiceProfile } from "@/lib/ai/voice"
import type { CurrentUser } from "@/lib/auth/dal"

const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })

function Chips({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Badge key={i} variant="outline" className="font-medium">
          {i}
        </Badge>
      ))}
    </span>
  )
}

/** Perfil de voz (skill: templates/voice.md). Leitura no card, edição em modal. */
export async function VoiceCard({ user }: { user: CurrentUser }) {
  const voice = await getVoiceProfile(user.id)
  const canGenerate = isAiConfigured() && Boolean(user.youtube_channel_id)

  const actions = (
    <>
      <GenerateVoiceButton hasProfile={Boolean(voice)} disabled={!canGenerate} />
      <EditVoiceDialog values={voice ?? undefined} />
    </>
  )

  if (!voice) {
    return (
      <SectionCard
        id="voz"
        title="Seu perfil"
        description={
          user.youtube_channel_id ? (
            "Ainda não criado. Gere a partir do seu canal (grátis) ou escreva você mesmo."
          ) : (
            <>
              Para gerar automaticamente,{" "}
              <Link href="/meu-canal" className="font-medium text-primary hover:underline">
                vincule o seu canal
              </Link>
              . Ou escreva você mesmo.
            </>
          )
        }
        actions={actions}
      >
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Sem este perfil, títulos e roteiros saem num tom genérico, que não parece você. E um texto no tom errado é pior do
          que nenhum, porque é você quem vai ler em voz alta na câmera.
        </p>
      </SectionCard>
    )
  }

  return (
    <SectionCard
      id="voz"
      title="Seu perfil"
      description={`${voice.source === "ai" ? "Gerado a partir do canal" : "Editado por você"} em ${dateFmt.format(new Date(voice.updated_at))}. Usado em todas as gerações de IA.`}
      actions={actions}
    >
      <DataList
        items={[
          { label: "Nicho", value: voice.niche, hint: "O assunto do seu canal. Muda o vocabulário e as regras que a IA segue." },
          { label: "Tom", value: voice.tone, hint: "Como você fala: didático, direto, descontraído, técnico..." },
          {
            label: "Com quem você fala",
            value: voice.audience,
            wide: true,
            hint: "Uma pessoa concreta que assiste você. Quanto mais específica, melhor a IA acerta o texto.",
          },
          {
            label: "Termos que são seus",
            value: voice.uses.length ? <Chips items={voice.uses} /> : null,
            wide: true,
            hint: "Expressões e palavras que você usa sempre. A IA tenta mantê-las.",
          },
          {
            label: "Nunca usa",
            value: voice.avoids.length ? <Chips items={voice.avoids} /> : null,
            wide: true,
            hint: "Palavras que não combinam com você. A IA evita.",
          },
          {
            label: "Não afirma nem promete",
            value: voice.wont_claim.length ? voice.wont_claim.join(" · ") : null,
            wide: true,
            hint: "Promessas que você não faz (ex.: resultado garantido). A IA recusa escrever isso por você.",
          },
          { label: "Formato", value: voice.format, wide: true, hint: "Como são os seus vídeos: tamanho, Shorts, séries..." },
        ]}
      />
    </SectionCard>
  )
}
