import type { Metadata } from "next"
import { SiteHeader } from "@/components/layout/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = { title: "Design · CCD Studio" }

const colors = [
  { name: "Warm Cream", token: "cream", hex: "#ffedd7", className: "bg-cream" },
  { name: "Walnut Shadow", token: "walnut", hex: "#100904", className: "bg-walnut" },
  { name: "Bark Brown", token: "bark", hex: "#382416", className: "bg-bark" },
  { name: "Cork Border", token: "cork", hex: "#40372e", className: "bg-cork" },
  { name: "Driftwood", token: "driftwood", hex: "#6c5f51", className: "bg-driftwood" },
  { name: "Ember Accent", token: "ember", hex: "#dc5000", className: "bg-ember" },
]

const type = [
  { token: "text-display", sample: "Display 51" },
  { token: "text-heading", sample: "Heading 41" },
  { token: "text-heading-sm", sample: "Heading SM 24" },
  { token: "text-subheading", sample: "Subheading 18" },
  { token: "text-label", sample: "Label 12" },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-card">
      <h2 className="text-heading-sm">{title}</h2>
      {children}
      <Separator className="mt-card" />
    </section>
  )
}

export default function DesignPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-col gap-card p-card pt-[120px]">
        <header className="flex flex-col gap-gutter">
          <p className="label text-muted-foreground">Referência · DESIGN.md</p>
          <h1 className="text-display">Design system</h1>
        </header>
        <Separator />

        <Section title="Cores">
          <div className="grid grid-cols-2 gap-gutter md:grid-cols-3 lg:grid-cols-6">
            {colors.map((c) => (
              <div key={c.token} className="flex flex-col gap-2">
                <div className={`aspect-square rounded-card border border-border ${c.className}`} />
                <p className="label">{c.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{c.token} · {c.hex}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Tipografia">
          <div className="flex flex-col gap-gutter">
            {type.map((t) => (
              <div key={t.token} className="flex flex-wrap items-baseline gap-x-card gap-y-1">
                <span className="w-32 font-mono text-xs text-muted-foreground">{t.token}</span>
                <span className={`${t.token} font-medium uppercase`}>{t.sample}</span>
              </div>
            ))}
            <div className="flex flex-wrap items-baseline gap-x-card gap-y-1">
              <span className="w-32 font-mono text-xs text-muted-foreground">text-body</span>
              <p className="max-w-3xl text-body">
                O único texto em caixa mista: peso 400, usado para descrever e explicar.
              </p>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-card gap-y-1">
              <span className="w-32 font-mono text-xs text-muted-foreground">.legal</span>
              <span className="legal text-ember">* Crédito editorial em Ember</span>
            </div>
          </div>
        </Section>

        <Section title="Botões">
          <div className="flex flex-wrap items-center gap-gutter">
            <Button>Pill preenchido</Button>
            <Button variant="outline">Ghost outline</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Excluir</Button>
            <Button variant="link">Link sublinhado</Button>
          </div>
          <div className="flex flex-wrap items-center gap-gutter">
            <Button size="xs" variant="outline">XS</Button>
            <Button size="sm" variant="outline">SM</Button>
            <Button variant="outline">Default</Button>
            <Button size="lg" variant="outline">LG</Button>
          </div>
        </Section>

        <Section title="Formulário e card">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Entrar</CardTitle>
              <CardDescription>Acesse sua conta do CCD Studio.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-gutter">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="voce@empresa.com" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="senha">Senha</Label>
                <Input id="senha" type="password" placeholder="••••••••" />
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="ghost">Cancelar</Button>
              <Button>Entrar</Button>
            </CardFooter>
          </Card>
        </Section>
      </main>
    </>
  )
}
