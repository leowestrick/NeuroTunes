import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    message: "API funktioniert",
    timestamp: new Date().toISOString(),
    env: {
      hasSpotifyClientId: !!process.env.SPOTIFY_CLIENT_ID,
      hasSpotifyClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    },
  })
}
