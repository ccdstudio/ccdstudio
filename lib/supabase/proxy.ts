import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "./database.types"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./public-env"

const PUBLIC_PATHS = ["/", "/login", "/esqueci-senha", "/auth/callback", "/privacidade", "/termos"]
const AUTH_ONLY_PATHS = ["/login"] // logado não precisa ver

// Renova a sessão (cookies) e faz o redirecionamento otimista.
// A autorização real acontece no DAL, perto dos dados.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value)
      },
    },
  })

  // Não colocar código entre createServerClient e getClaims().
  const { data } = await supabase.auth.getClaims()
  const isLoggedIn = Boolean(data?.claims?.sub)
  const { pathname } = request.nextUrl

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = ""
    if (path === "/login" && pathname !== "/") url.searchParams.set("next", pathname)
    const redirect = NextResponse.redirect(url)
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie)
    return redirect
  }

  if (!isLoggedIn && !PUBLIC_PATHS.includes(pathname)) return redirectTo("/login")
  if (isLoggedIn && AUTH_ONLY_PATHS.includes(pathname)) return redirectTo("/painel")

  return response
}
