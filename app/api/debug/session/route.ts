import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const debugInfo = {
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : [],
      hasAccessToken: !!session?.accessToken,
      hasRefreshToken: !!session?.refreshToken,
      hasError: !!session?.error,
      error: session?.error,
      expiresAt: session?.expiresAt,
      currentTime: Math.floor(Date.now() / 1000),
      isExpired: session?.expiresAt ? Date.now() > (session.expiresAt as number) * 1000 : null,
      user: session?.user
        ? {
            name: session.user.name,
            email: session.user.email,
          }
        : null,
      accessTokenPreview: session?.accessToken ? session.accessToken.substring(0, 20) + "..." : null,
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("Debug Session Error:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Abrufen der Session-Informationen",
        details: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 },
    )
  }
}
