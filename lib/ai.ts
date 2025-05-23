import { searchTracks } from "./spotify"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function generatePlaylist(keywords: string[], accessToken: string) {
  // Erstelle einen Prompt für das KI-Modell
  const prompt = `
    Erstelle eine Playlist basierend auf den folgenden Keywords: ${keywords.join(", ")}.
    Gib mir eine Liste von 20 Songs (Titel und Künstler), die zu diesen Keywords passen.
    Formatiere die Ausgabe als JSON-Array mit Objekten, die "title" und "artist" enthalten.
    Beispiel: [{"title": "Song Name", "artist": "Artist Name"}, ...]
  `

  // Generiere Songvorschläge mit dem KI-Modell
  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
  })

  // Parse die JSON-Antwort
  let songSuggestions
  try {
    songSuggestions = JSON.parse(text)
  } catch (error) {
    console.error("Fehler beim Parsen der KI-Antwort:", error)
    throw new Error("Fehler bei der KI-Antwort")
  }

  // Suche die vorgeschlagenen Songs in Spotify
  const tracks = []

  for (const song of songSuggestions) {
    const query = `track:${song.title} artist:${song.artist}`
    const searchResults = await searchTracks(accessToken, query, 1)

    if (searchResults && searchResults.length > 0) {
      tracks.push(searchResults[0])
    }

    // Begrenze die Anzahl der Tracks auf 20
    if (tracks.length >= 20) {
      break
    }
  }

  // Wenn nicht genug Tracks gefunden wurden, führe eine allgemeinere Suche durch
  if (tracks.length < 10) {
    const generalQuery = keywords.join(" ")
    const additionalTracks = await searchTracks(accessToken, generalQuery, 20 - tracks.length)

    // Füge nur Tracks hinzu, die noch nicht in der Liste sind
    for (const track of additionalTracks) {
      if (!tracks.some((t) => t.id === track.id)) {
        tracks.push(track)
      }

      if (tracks.length >= 20) {
        break
      }
    }
  }

  return tracks
}
