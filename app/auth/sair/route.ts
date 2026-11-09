import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

const reasons = new Set(["inativa", "saiu"])

async function signOut(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const motivo = request.nextUrl.searchParams.get("motivo")
  const url = new URL("/login", request.url)
  url.searchParams.set("motivo", motivo && reasons.has(motivo) ? motivo : "saiu")
  return NextResponse.redirect(url, { status: 303 })
}

// POST: botão "Sair". GET: usado pelo DAL para encerrar a sessão de contas desativadas.
export const POST = signOut
export const GET = signOut
