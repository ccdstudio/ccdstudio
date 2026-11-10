import { NextResponse, type NextRequest } from "next/server"
import { safeNext } from "@/lib/auth/schemas"
import { createClient } from "@/lib/supabase/server"

// Retorno do login com Google (Supabase → app). Troca o code pela sessão e confere se a conta está ativa.
// Cadastro público desativado: e-mail sem conta no CCD Studio volta com "google_sem_conta".

function toLogin(request: NextRequest, motivo: "google_sem_conta" | "google_erro" | "inativa") {
  const url = new URL("/login", request.url)
  url.searchParams.set("motivo", motivo)
  return NextResponse.redirect(url, { status: 303 })
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const errorCode = params.get("error_code") ?? ""
  const errorText = `${params.get("error") ?? ""} ${params.get("error_description") ?? ""}`.toLowerCase()

  if (errorCode || params.get("error")) {
    console.error("[auth] Google callback:", errorCode, errorText.trim())
    if (errorCode === "signup_disabled" || errorText.includes("signups not allowed")) {
      return toLogin(request, "google_sem_conta")
    }
    if (errorCode === "user_banned" || errorText.includes("banned")) return toLogin(request, "inativa")
    return toLogin(request, "google_erro")
  }

  const code = params.get("code")
  if (!code) return toLogin(request, "google_erro")

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    console.error("[auth] exchangeCodeForSession:", error?.code, error?.message)
    return toLogin(request, error?.code === "user_banned" ? "inativa" : "google_erro")
  }

  const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", data.user.id).single()
  if (!profile?.is_active) {
    await supabase.auth.signOut()
    return toLogin(request, "inativa")
  }

  return NextResponse.redirect(new URL(safeNext(params.get("next")), request.url), { status: 303 })
}
