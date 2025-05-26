import { searchTracks } from "./spotify"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { analyzeMusicPersonality, generatePersonalityPrompt, type MusicPersonality } from "./music-personality"

export async function generatePlaylist(keywords: string[], accessToken: string) {
  try {
    console.log("Starte Playlist-Generierung mit Persönlichkeitsanalyse...")

    // Analysiere die Musikpersönlichkeit des Nutzers
    let personality: MusicPersonality | null = null
    let prompt = ""

    try {
      console.log("Analysiere Musikpersönlichkeit...")
      personality = await analyzeMusicPersonality(accessToken)
      prompt = generatePersonalityPrompt(personality, keywords)
      console.log("Persönlichkeitsanalyse abgeschlossen:", {
        topGenres: personality.genres.slice(0, 3).map((g) => g.genre),
        dominantMood: personality.moodProfile.dominantMood,
        energyLevel: Math.round(personality.audioFeatures.energy * 100),
        openness: Math.round(personality.discoveryProfile.openness * 100),
      })
    } catch (personalityError) {
      console.warn("Persönlichkeitsanalyse fehlgeschlagen, verwende Standard-Prompt:", personalityError)
      prompt = generateStandardPrompt(keywords)
    }

    // Generiere Songvorschläge mit dem personalisierten Prompt
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt,
      temperature: personality ? 0.6 : 0.7, // Weniger Zufälligkeit bei personalisierten Prompts
      maxTokens: 1000,
    })

    console.log("Gemini Antwort erhalten")

    // Parse die JSON-Antwort
    let songSuggestions
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
      songSuggestions = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Fehler beim Parsen der Gemini-Antwort:", parseError)
      console.log("Rohe Antwort:", text)
      songSuggestions = generateFallbackPlaylist(keywords, personality)
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

      if (tracks.length >= 20) {
        break
      }
    }

    // Wenn nicht genug Tracks gefunden wurden, führe eine personalisierte Suche durch
    if (tracks.length < 10) {
      console.log("Nicht genug Tracks gefunden, führe personalisierte Suche durch...")
      const additionalTracks = await searchPersonalizedTracks(accessToken, keywords, personality, 20 - tracks.length)

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
    return {
      tracks,
      personality: personality
        ? {
            topGenres: personality.genres.slice(0, 5).map((g) => g.genre),
            dominantMood: personality.moodProfile.dominantMood,
            energyLevel: Math.round(personality.audioFeatures.energy * 100),
            valence: Math.round(personality.audioFeatures.valence * 100),
            openness: Math.round(personality.discoveryProfile.openness * 100),
          }
        : null,
    }
  } catch (error) {
    console.error("Fehler bei der Playlist-Generierung:", error)

    // Fallback: Erstelle eine Playlist basierend auf Keywords ohne KI
    const fallbackQuery = keywords.join(" ")
    const fallbackTracks = await searchTracks(accessToken, fallbackQuery, 20)

    return {
      tracks: fallbackTracks || [],
      personality: null,
    }
  }
}

function generateStandardPrompt(keywords: string[]): string {
  return `
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
}

async function searchPersonalizedTracks(
  accessToken: string,
  keywords: string[],
  personality: MusicPersonality | null,
  limit: number,
) {
  if (!personality) {
    const generalQuery = keywords.join(" ")
    return await searchTracks(accessToken, generalQuery, limit)
  }

  // Erstelle personalisierte Suchbegriffe basierend auf der Persönlichkeit
  const topGenres = personality.genres.slice(0, 3).map((g) => g.genre)
  const searchQueries = [...keywords, ...topGenres, personality.moodProfile.dominantMood]

  const results = []
  for (const query of searchQueries) {
    if (results.length >= limit) break

    try {
      const tracks = await searchTracks(accessToken, query, Math.ceil(limit / searchQueries.length))
      results.push(...tracks)
    } catch (error) {
      console.warn(`Suche für "${query}" fehlgeschlagen:`, error)
    }
  }

  // Entferne Duplikate und limitiere
  const uniqueTracks = results.filter((track, index, self) => index === self.findIndex((t) => t.id === track.id))

  return uniqueTracks.slice(0, limit)
}

function generateFallbackPlaylist(keywords: string[], personality: MusicPersonality | null) {
  const fallbackSongs = [
    // Standard-Songs
    { title: "Weightless", artist: "Marconi Union" },
    { title: "Clair de Lune", artist: "Claude Debussy" },
    { title: "Mad World", artist: "Gary Jules" },
    { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars" },
    { title: "Can't Stop the Feeling!", artist: "Justin Timberlake" },
    { title: "Happy", artist: "Pharrell Williams" },
    { title: "I Gotta Feeling", artist: "The Black Eyed Peas" },
    { title: "Party Rock Anthem", artist: "LMFAO" },
    { title: "Good as Hell", artist: "Lizzo" },
    { title: "Summer", artist: "Calvin Harris" },
    { title: "Blinding Lights", artist: "The Weeknd" },
    { title: "Levitating", artist: "Dua Lipa" },
    { title: "Don't Stop Believin'", artist: "Journey" },
    { title: "Bohemian Rhapsody", artist: "Queen" },
    { title: "Sweet Child O' Mine", artist: "Guns N' Roses" },
    { title: "Shape of You", artist: "Ed Sheeran" },
    { title: "Anti-Hero", artist: "Taylor Swift" },
    { title: "As It Was", artist: "Harry Styles" },
    { title: "God's Plan", artist: "Drake" },
    { title: "HUMBLE.", artist: "Kendrick Lamar" },
  ]

  // Personalisiere Fallback basierend auf Persönlichkeit
  if (personality) {
    const topGenres = personality.genres.slice(0, 3).map((g) => g.genre)

    // Füge genre-spezifische Songs hinzu
    if (topGenres.includes("pop")) {
      fallbackSongs.unshift(
        { title: "Flowers", artist: "Miley Cyrus" },
        { title: "Unholy", artist: "Sam Smith ft. Kim Petras" },
      )
    }

    if (topGenres.includes("rock") || topGenres.includes("alternative rock")) {
      fallbackSongs.unshift(
        { title: "Mr. Brightside", artist: "The Killers" },
        { title: "Somebody Told Me", artist: "The Killers" },
      )
    }

    if (topGenres.includes("hip hop") || topGenres.includes("rap")) {
      fallbackSongs.unshift(
        { title: "Industry Baby", artist: "Lil Nas X ft. Jack Harlow" },
        { title: "Stay", artist: "The Kid LAROI & Justin Bieber" },
      )
    }
  }

  return fallbackSongs.slice(0, 20)
}

// Exportiere auch die Persönlichkeitsanalyse für andere Komponenten
export { analyzeMusicPersonality, type MusicPersonality } from "./music-personality"
