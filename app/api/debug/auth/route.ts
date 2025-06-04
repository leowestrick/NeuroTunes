import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextauthUrl: process.env.NEXTAUTH_URL,
        nextauthSecret: !!process.env.NEXTAUTH_SECRET,
        spotifyClientId: !!process.env.SPOTIFY_CLIENT_ID,
        spotifyClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
        spotifyClientIdValue: process.env.SPOTIFY_CLIENT_ID?.substring(0, 8) + "...",
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
      urls: {
        baseUrl: process.env.NEXTAUTH_URL,
        callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/spotify`,
        signInUrl: `${process.env.NEXTAUTH_URL}/api/auth/signin/spotify`,
      },
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    console.error("Debug Auth Error:", error)
    return NextResponse.json(
      {
        error: "Debug error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
