import { redirect } from "next/navigation"

// Antiga página de análise: agora é uma aba do Relatório do canal.
export default function Page() {
  redirect("/analises?aba=voz")
}
