import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { generatePlaylist, analyzeKeywords } from "@/lib/ai"
import { createPlaylist, addTracksToPlaylist } from "@/lib/spotify"

export async function POST(req: NextRequest) {
  try {
    // Hole Session direkt mit authOptions
    const session = await getServerSession(authOptions)

    console.log("Session Status:", {
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      hasError: !!session?.error,
      sessionKeys: session ? Object.keys(session) : [],
    })

    if (!session) {
      console.error("Keine Session gefunden")
      return NextResponse.json({ error: "Nicht authentifiziert - keine Session" }, { status: 401 })
    }

    if (!session.accessToken) {
      console.error("Kein Access Token in Session:", session)
      return NextResponse.json({ error: "Nicht authentifiziert - kein Access Token" }, { status: 401 })
    }

    if (session.error) {
      console.error("Session Fehler:", session.error)
      return NextResponse.json({ error: `Authentifizierungsfehler: ${session.error}` }, { status: 401 })
    }

    const { keywords } = await req.json()

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: "Keywords sind erforderlich" }, { status: 400 })
    }

    console.log("Generiere personalisierte Playlist für Keywords:", keywords)
    console.log("Access Token verfügbar:", session.accessToken.substring(0, 20) + "...")

    // Analysiere Keywords für bessere Playlist-Generierung
    const analysis = analyzeKeywords(keywords)
    console.log("Keyword-Analyse:", analysis)

    // KI-basierte Playlist-Generierung mit Persönlichkeitsanalyse
    const result = await generatePlaylist(keywords, session.accessToken)
    const { tracks, personality } = result

    if (!tracks || tracks.length === 0) {
      return NextResponse.json({ error: "Keine passenden Songs gefunden" }, { status: 404 })
    }

    // Erstelle eine aussagekräftige Playlist-Beschreibung
    let description = `🎵 Generiert mit NeuroTunes & Google Gemini basierend auf: ${keywords.join(", ")}`

    if (personality) {
      description += ` | Persönlichkeit: ${personality.dominantMood} (${personality.energyLevel}% Energie)`
      if (personality.topGenres.length > 0) {
        description += ` | Genres: ${personality.topGenres.slice(0, 3).join(", ")}`
      }
    }

    // Playlist in Spotify erstellen
    const playlistName = `NeuroTunes: ${keywords.join(", ")}`
    const playlist = await createPlaylist(session.accessToken, playlistName, description)

    // Tracks zur Playlist hinzufügen
    const trackUris = tracks.map((track) => track.uri).filter(Boolean)

    if (trackUris.length > 0) {
      await addTracksToPlaylist(session.accessToken, playlist.id, trackUris)
    }

    console.log(`Personalisierte Playlist "${playlistName}" erfolgreich erstellt mit ${trackUris.length} Tracks`)

    return NextResponse.json({
      success: true,
      playlist: {
        ...playlist,
        tracks,
        keywords,
        analysis,
        personality,
        trackCount: trackUris.length,
        personalized: !!personality,
      },
    })
  } catch (error) {
    console.error("Fehler bei der personalisierten Playlist-Generierung:", error)

    // Detailliertere Fehlermeldungen
    let errorMessage = "Fehler bei der Playlist-Generierung"

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "Google Gemini API-Schlüssel ist ungültig oder fehlt"
      } else if (error.message.includes("quota")) {
        errorMessage = "API-Limit erreicht. Bitte versuche es später erneut."
      } else if (error.message.includes("network")) {
        errorMessage = "Netzwerkfehler. Bitte überprüfe deine Internetverbindung."
      } else if (error.message.includes("Top-Künstler") || error.message.includes("Top-Tracks")) {
        errorMessage =
          "Nicht genügend Spotify-Daten für Personalisierung verfügbar. Playlist wird mit Standard-Algorithmus erstellt."
      } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        errorMessage = "Spotify-Token ist abgelaufen. Bitte melde dich erneut an."
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}
