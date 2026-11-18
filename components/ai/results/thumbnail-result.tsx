import { CopyButton } from "@/components/shared/copy-button"
import { DataList } from "@/components/shared/data-list"
import { SectionCard } from "@/components/shared/section-card"
import { Stagger } from "@/components/shared/stagger"
import { THUMBNAIL_STYLES, type ThumbnailOutput, type ThumbnailStoredInput } from "@/lib/ai/prompts/thumbnail"
import { creditsLabel } from "@/lib/credits/costs"

// Corpo do resultado da Thumbnail: usado em /criar/thumbnail/[id] e na aba do Vídeo completo.
// `image`: URL assinada já gerada no servidor (ou undefined se não deu para assinar).

export function ThumbnailResultBody({
  output: o,
  input: i,
  image,
  credits,
}: {
  output: ThumbnailOutput
  input: ThumbnailStoredInput
  image: string | undefined
  credits: number
}) {
  const style = THUMBNAIL_STYLES.find((s) => s.value === i.estilo)?.label ?? i.estilo
  return (
    <Stagger className="flex flex-col gap-8">
      <figure className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={`Capa do vídeo: ${i.titulo}`} width={1280} height={720} className="aspect-video w-full object-cover" />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
              Não foi possível carregar a imagem agora. Recarregue a página.
            </div>
          )}
        </div>
        <figcaption className="text-xs text-muted-foreground">
          1280 × 720 px, o tamanho recomendado pelo YouTube. Confira como fica pequena: é assim que aparece no celular.
        </figcaption>
      </figure>

      {image ? (
        <SectionCard title="Como aparece no feed" description="O tamanho real de uma capa na lista de vídeos do celular.">
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="aspect-video w-44 shrink-0 rounded-lg object-cover" />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="line-clamp-2 text-sm font-semibold">{i.titulo}</p>
              <p className="text-xs text-muted-foreground">Seu canal · agora</p>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="A ideia da capa" description="O que a IA pensou antes de desenhar.">
        <DataList
          items={[
            { label: "Texto da capa", value: o.texto_capa },
            { label: "Estilo", value: style },
            { label: "Cena", value: o.cena, wide: true },
            { label: "Cores", value: o.cores, wide: true },
            { label: "Composição", value: o.composicao, wide: true },
            { label: "Por que chama o clique", value: o.por_que_clica, wide: true },
          ]}
        />
      </SectionCard>

      <SectionCard
        title="Prompts usados"
        description="O pedido que você fez e o prompt exato que foi enviado ao gerador de imagens. Use o prompt para gerar variações em outra ferramenta."
        hint="Prompt é o texto de instrução que a IA recebe. O da imagem fica em inglês porque o gerador entende melhor; o texto da capa vai exatamente como aparece na imagem."
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="label">Prompt da imagem · {o.modelo_imagem}</span>
              <CopyButton text={o.prompt_imagem} what="Prompt" label="Copiar prompt" />
            </div>
            <pre className="rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed whitespace-pre-wrap">{o.prompt_imagem}</pre>
            {o.usou_foto ? (
              <p className="text-xs text-muted-foreground">
                Gerada com a sua foto como referência. A foto foi usada só nesta geração e não ficou guardada.
              </p>
            ) : null}
          </div>
          <DataList
            items={[
              { label: "Seu pedido: título", value: i.titulo, wide: true },
              { label: "Seu pedido: do que trata", value: i.assunto, wide: true },
              { label: "Seu pedido: texto da capa", value: i.texto_capa || "deixou para a IA sugerir" },
              { label: "Seu pedido: foto", value: i.usou_foto ? "enviou uma foto" : "sem foto" },
            ]}
          />
        </div>
      </SectionCard>

      <p className="text-xs text-muted-foreground">
        Gerado por IA com {creditsLabel(credits)}. Confira o texto da imagem antes de publicar: geradores de
        imagem às vezes erram letras.
      </p>
    </Stagger>
  )
}
