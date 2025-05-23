import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // Prüfe, ob der Benutzer authentifiziert ist
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Geschützte Routen definieren
  const protectedPaths = ["/dashboard", "/playlist", "/profile", "/settings"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Wenn es sich um eine geschützte Route handelt und kein Token vorhanden ist
  if (isProtectedPath && !token) {
    // Umleitung zur Startseite mit einem Hinweis
    const url = new URL("/", request.url)
    url.searchParams.set("message", "login-required")
    return NextResponse.redirect(url)
  }

  // Wenn der Benutzer authentifiziert ist und versucht, auf die Startseite zuzugreifen
  if (token && request.nextUrl.pathname === "/" && !request.nextUrl.searchParams.has("message")) {
    // Optional: Umleitung zum Dashboard für authentifizierte Benutzer
    // return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
