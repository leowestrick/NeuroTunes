import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { testApiPermissions } from "@/lib/spotify"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    // Teste alle API-Berechtigungen
    const permissionResults = await testApiPermissions(session.accessToken)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: {
        user: session.user
          ? {
              name: session.user.name,
              email: session.user.email,
            }
          : null,
        tokenExpiry: session.expiresAt ? new Date(session.expiresAt * 1000).toISOString() : null,
        hasError: !!session.error,
        error: session.error,
      },
      permissions: permissionResults,
    })
  } catch (error) {
    console.error("API Permissions Test Error:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Testen der API-Berechtigungen",
        details: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 },
    )
  }
}
