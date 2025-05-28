import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextauthUrl: process.env.NEXTAUTH_URL,
        hasSpotifyClientId: !!process.env.SPOTIFY_CLIENT_ID,
        hasSpotifyClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
        hasNextauthSecret: !!process.env.NEXTAUTH_SECRET,
      },
      session: {
        exists: !!session,
        hasAccessToken: !!session?.accessToken,
        hasRefreshToken: !!session?.refreshToken,
        hasError: !!session?.error,
        error: session?.error,
        expiresAt: session?.expiresAt,
        user: session?.user
          ? {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
            }
          : null,
      },
      token: {
        exists: !!token,
        hasAccessToken: !!token?.accessToken,
        hasRefreshToken: !!token?.refreshToken,
        hasError: !!token?.error,
        error: token?.error,
        expiresAt: token?.expiresAt,
        isExpired: token?.expiresAt ? Date.now() > (token.expiresAt as number) * 1000 : null,
      },
      cookies: {
        sessionToken: req.cookies.get("next-auth.session-token")?.value ? "exists" : "missing",
        csrfToken: req.cookies.get("next-auth.csrf-token")?.value ? "exists" : "missing",
      },
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    console.error("Debug Auth Error:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Abrufen der Auth-Debug-Informationen",
        details: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 },
    )
  }
}
