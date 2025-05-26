import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { generatePlaylist, analyzeKeywords } from "@/lib/ai"
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

    console.log("Generiere personalisierte Playlist für Keywords:", keywords)

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
