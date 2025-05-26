import { searchTracks } from "./spotify"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function generatePlaylist(keywords: string[], accessToken: string) {
  try {
    // Erstelle einen detaillierten Prompt für das Gemini-Modell
    const prompt = `
Du bist ein Musik-Experte und Playlist-Kurator. Erstelle eine Playlist basierend auf den folgenden Keywords: ${keywords.join(", ")}.

Analysiere die Keywords und erstelle eine Liste von 20 Songs, die perfekt zu der gewünschten Stimmung und dem Musikstil passen.

Berücksichtige dabei:
- Die emotionale Stimmung der Keywords
- Passende Musikgenres
- Bekannte und beliebte Songs, die auf Spotify verfügbar sind
- Eine gute Mischung aus verschiedenen Künstlern
- Zeitlose Klassiker und moderne Hits

Formatiere die Ausgabe als JSON-Array mit Objekten, die "title" und "artist" enthalten.
Beispiel: [{"title": "Song Name", "artist": "Artist Name"}, ...]

Gib NUR das JSON-Array zurück, ohne zusätzlichen Text oder Erklärungen.
`

    // Generiere Songvorschläge mit dem Gemini-Modell
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt,
      temperature: 0.7,
      maxTokens: 1000,
    })

    console.log("Gemini Antwort:", text)

    // Parse die JSON-Antwort
    let songSuggestions
    try {
      // Entferne mögliche Markdown-Formatierung
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
      songSuggestions = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Fehler beim Parsen der Gemini-Antwort:", parseError)
      console.log("Rohe Antwort:", text)

      // Fallback: Verwende eine Standard-Playlist basierend auf Keywords
      songSuggestions = generateFallbackPlaylist(keywords)
    }

    // Validiere die Struktur der Antwort
    if (!Array.isArray(songSuggestions)) {
      throw new Error("Gemini-Antwort ist kein Array")
    }

    // Suche die vorgeschlagenen Songs in Spotify
    const tracks = []
    const maxTracks = Math.min(songSuggestions.length, 20)

    for (let i = 0; i < maxTracks; i++) {
      const song = songSuggestions[i]

      if (!song.title || !song.artist) {
        console.warn("Ungültiger Song:", song)
        continue
      }

      try {
        // Verschiedene Suchstrategien ausprobieren
        const searchQueries = [
          `track:"${song.title}" artist:"${song.artist}"`,
          `"${song.title}" "${song.artist}"`,
          `${song.title} ${song.artist}`,
        ]

        let searchResults = null

        for (const query of searchQueries) {
          searchResults = await searchTracks(accessToken, query, 1)
          if (searchResults && searchResults.length > 0) {
            break
          }
          // Kurze Pause zwischen Anfragen
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        if (searchResults && searchResults.length > 0) {
          tracks.push(searchResults[0])
        } else {
          console.warn(`Song nicht gefunden: ${song.title} von ${song.artist}`)
        }
      } catch (error) {
        console.error(`Fehler bei der Suche nach ${song.title}:`, error)
      }

      // Begrenze die Anzahl der Tracks auf 20
      if (tracks.length >= 20) {
        break
      }
    }

    // Wenn nicht genug Tracks gefunden wurden, führe eine allgemeinere Suche durch
    if (tracks.length < 10) {
      console.log("Nicht genug Tracks gefunden, führe allgemeine Suche durch...")
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

    console.log(`Playlist erstellt mit ${tracks.length} Tracks`)
    return tracks
  } catch (error) {
    console.error("Fehler bei der Playlist-Generierung:", error)

    // Fallback: Erstelle eine Playlist basierend auf Keywords ohne KI
    const fallbackQuery = keywords.join(" ")
    const fallbackTracks = await searchTracks(accessToken, fallbackQuery, 20)

    return fallbackTracks || []
  }
}

// Fallback-Funktion für den Fall, dass die KI-Antwort nicht geparst werden kann
function generateFallbackPlaylist(keywords: string[]) {
  const fallbackSongs = [
    // Entspannt
    { title: "Weightless", artist: "Marconi Union" },
    { title: "Clair de Lune", artist: "Claude Debussy" },
    { title: "Mad World", artist: "Gary Jules" },

    // Energetisch
    { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars" },
    { title: "Can't Stop the Feeling!", artist: "Justin Timberlake" },
    { title: "Happy", artist: "Pharrell Williams" },

    // Party
    { title: "I Gotta Feeling", artist: "The Black Eyed Peas" },
    { title: "Party Rock Anthem", artist: "LMFAO" },
    { title: "Good as Hell", artist: "Lizzo" },

    // Sommer
    { title: "Summer", artist: "Calvin Harris" },
    { title: "Blinding Lights", artist: "The Weeknd" },
    { title: "Levitating", artist: "Dua Lipa" },

    // Rock
    { title: "Don't Stop Believin'", artist: "Journey" },
    { title: "Bohemian Rhapsody", artist: "Queen" },
    { title: "Sweet Child O' Mine", artist: "Guns N' Roses" },

    // Pop
    { title: "Shape of You", artist: "Ed Sheeran" },
    { title: "Anti-Hero", artist: "Taylor Swift" },
    { title: "As It Was", artist: "Harry Styles" },

    // Hip-Hop
    { title: "God's Plan", artist: "Drake" },
    { title: "HUMBLE.", artist: "Kendrick Lamar" },
  ]

  // Filtere Songs basierend auf Keywords
  const relevantSongs = fallbackSongs.filter((song) => {
    return keywords.some(
      (keyword) =>
        song.title.toLowerCase().includes(keyword.toLowerCase()) ||
        song.artist.toLowerCase().includes(keyword.toLowerCase()),
    )
  })

  // Wenn keine relevanten Songs gefunden wurden, gib alle zurück
  return relevantSongs.length > 0 ? relevantSongs.slice(0, 20) : fallbackSongs.slice(0, 20)
}

// Funktion zur Analyse von Keywords für bessere Playlist-Generierung
export function analyzeKeywords(keywords: string[]) {
  const moodKeywords = {
    happy: ["glücklich", "fröhlich", "positiv", "gut gelaunt", "happy"],
    sad: ["traurig", "melancholisch", "deprimiert", "down", "sad"],
    energetic: ["energetisch", "power", "workout", "sport", "motivierend"],
    relaxed: ["entspannt", "chill", "ruhig", "meditation", "relaxed"],
    party: ["party", "feiern", "club", "dance", "tanzen"],
    romantic: ["romantisch", "liebe", "romantic", "love", "date"],
  }

  const genreKeywords = {
    pop: ["pop", "mainstream", "charts", "radio"],
    rock: ["rock", "alternative", "indie rock", "classic rock"],
    hiphop: ["hip-hop", "rap", "urban", "beats"],
    electronic: ["electronic", "edm", "house", "techno", "dance"],
    jazz: ["jazz", "blues", "soul", "swing"],
    classical: ["klassik", "classical", "orchestra", "symphony"],
  }

  const detectedMoods = []
  const detectedGenres = []

  // Analysiere Stimmungen
  for (const [mood, words] of Object.entries(moodKeywords)) {
    if (keywords.some((keyword) => words.some((word) => keyword.toLowerCase().includes(word)))) {
      detectedMoods.push(mood)
    }
  }

  // Analysiere Genres
  for (const [genre, words] of Object.entries(genreKeywords)) {
    if (keywords.some((keyword) => words.some((word) => keyword.toLowerCase().includes(word)))) {
      detectedGenres.push(genre)
    }
  }

  return {
    moods: detectedMoods,
    genres: detectedGenres,
    keywords,
  }
}
