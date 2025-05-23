import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { generatePlaylist } from "@/lib/ai"
import { createPlaylist, addTracksToPlaylist } from "@/lib/spotify"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const { keywords } = await req.json()

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: "Keywords sind erforderlich" }, { status: 400 })
    }

    // KI-basierte Playlist-Generierung
    const tracks = await generatePlaylist(keywords, session.accessToken)

    // Playlist in Spotify erstellen
    const playlistName = `NeuroTunes: ${keywords.join(", ")}`
    const description = `Generiert mit NeuroTunes basierend auf: ${keywords.join(", ")}`

    const playlist = await createPlaylist(session.accessToken, playlistName, description)

    // Tracks zur Playlist hinzufügen
    await addTracksToPlaylist(
      session.accessToken,
      playlist.id,
      tracks.map((track) => track.uri),
    )

    return NextResponse.json({
      success: true,
      playlist: {
        ...playlist,
        tracks,
        keywords,
      },
    })
  } catch (error) {
    console.error("Fehler bei der Playlist-Generierung:", error)
    return NextResponse.json({ error: "Fehler bei der Playlist-Generierung" }, { status: 500 })
  }
}
