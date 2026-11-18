import { Quicksand } from "next/font/google"
import { LpFooter } from "@/components/site/lp-footer"
import { LpHeader } from "@/components/site/lp-header"
import { LpHero } from "@/components/site/lp-hero"
import { LpIntro } from "@/components/site/lp-intro"
import {
  AnalysesSection,
  CreditsSection,
  FaqSection,
  HowItWorksSection,
  ToolsSection,
} from "@/components/site/lp-sections"

// Landing page no design do CCD Masters (DESIGN - LP.md): Quicksand, navy + teal + dourado raro.
// A fonte é carregada só aqui para não afetar a área logada (que segue o DESIGN.md).
const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-quicksand" })

export default function Home() {
  return (
    <div className={`lp ${quicksand.variable} flex flex-1 flex-col bg-white font-lp text-ccd-ink`}>
      <LpIntro />
      <LpHeader />
      <main className="flex-1">
        {/* Alternância claro/escuro: navy → mist → branco → navy → mist → branco → rodapé navy-darker */}
        <LpHero />
        <ToolsSection />
        <AnalysesSection />
        <HowItWorksSection />
        <CreditsSection />
        <FaqSection />
      </main>
      <LpFooter />
    </div>
  )
}
