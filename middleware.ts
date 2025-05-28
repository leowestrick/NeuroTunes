import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Öffentliche Routen, die keine Authentifizierung benötigen
  const publicPaths = ["/", "/login", "/auth/error", "/api/auth", "/_next", "/favicon.ico", "/api/debug"]

  // Prüfe ob es sich um eine öffentliche Route handelt
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  try {
    // Prüfe, ob der Benutzer authentifiziert ist
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    console.log("Middleware - Token Check:", {
      pathname,
      hasToken: !!token,
      tokenError: token?.error,
      expiresAt: token?.expiresAt,
      currentTime: Math.floor(Date.now() / 1000),
    })

    // Geschützte Routen definieren
    const protectedPaths = ["/dashboard", "/playlist", "/profile", "/settings"]
    const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

    if (isProtectedPath) {
      // Kein Token vorhanden
      if (!token) {
        console.log("Middleware - Kein Token, leite zu Login weiter")
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Token hat Fehler
      if (token.error) {
        console.log("Middleware - Token-Fehler:", token.error)
        const errorUrl = new URL("/auth/error", request.url)
        errorUrl.searchParams.set("error", token.error as string)
        return NextResponse.redirect(errorUrl)
      }

      // Token ist abgelaufen
      const now = Math.floor(Date.now() / 1000)
      if (token.expiresAt && now > (token.expiresAt as number)) {
        console.log("Middleware - Token abgelaufen")
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        loginUrl.searchParams.set("error", "TokenExpired")
        return NextResponse.redirect(loginUrl)
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware Error:", error)
    // Bei Fehlern leite zu Login weiter
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("error", "MiddlewareError")
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
}
