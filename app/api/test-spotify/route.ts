import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Test Spotify API connectivity
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error: "Missing Spotify credentials",
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
        },
        { status: 400 },
      )
    }

    // Test client credentials flow
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Spotify API connection successful",
        tokenType: data.token_type,
        expiresIn: data.expires_in,
      })
    } else {
      return NextResponse.json(
        {
          error: "Spotify API error",
          details: data,
          status: response.status,
        },
        { status: response.status },
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Network error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
