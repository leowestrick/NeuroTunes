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

    // Parse die JSON-Antwort mit verbesserter Logik
    let songSuggestions
    try {
      songSuggestions = parseGeminiResponse(text)
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
        // Bereinige Künstlernamen von Kommentaren
        const cleanArtist = cleanArtistName(song.artist)
        const cleanTitle = cleanSongTitle(song.title)

        // Verschiedene Suchstrategien ausprobieren
        const searchQueries = [
          `track:"${cleanTitle}" artist:"${cleanArtist}"`,
          `"${cleanTitle}" "${cleanArtist}"`,
          `${cleanTitle} ${cleanArtist}`,
          // Fallback ohne Anführungszeichen
          `${cleanTitle} ${cleanArtist}`.replace(/['"]/g, ""),
        ]

        let searchResults = null

        for (const query of searchQueries) {
          searchResults = await searchTracks(accessToken, query, 3) // Mehr Ergebnisse für bessere Auswahl
          if (searchResults && searchResults.length > 0) {
            // Wähle das beste Ergebnis basierend auf Übereinstimmung
            const bestMatch = findBestMatch(cleanTitle, cleanArtist, searchResults)
            if (bestMatch) {
              searchResults = [bestMatch]
              break
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        if (searchResults && searchResults.length > 0) {
          tracks.push(searchResults[0])
          console.log(`✓ Gefunden: ${cleanTitle} von ${cleanArtist}`)
        } else {
          console.warn(`✗ Song nicht gefunden: ${cleanTitle} von ${cleanArtist}`)
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

// Verbesserte JSON-Parsing-Funktion
function parseGeminiResponse(text: string) {
  console.log("Parsing Gemini response...")

  // Entferne Code-Block-Marker
  const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()

  // Finde JSON-Array im Text
  const jsonStart = cleanedText.indexOf("[")
  const jsonEnd = cleanedText.lastIndexOf("]")

  if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
    throw new Error("Kein gültiges JSON-Array gefunden")
  }

  // Extrahiere nur den JSON-Teil
  const jsonText = cleanedText.substring(jsonStart, jsonEnd + 1)

  try {
    const parsed = JSON.parse(jsonText)
    console.log(`✓ JSON erfolgreich geparst: ${parsed.length} Songs`)
    return parsed
  } catch (error) {
    console.error("JSON-Parsing fehlgeschlagen:", error)
    console.log("Extrahierter JSON-Text:", jsonText)

    // Versuche JSON zu reparieren
    return repairAndParseJSON(jsonText)
  }
}

// JSON-Reparatur-Funktion
function repairAndParseJSON(jsonText: string) {
  console.log("Versuche JSON zu reparieren...")

  try {
    // Entferne Kommentare in Klammern aus dem JSON
    let repairedText = jsonText.replace(/$$.*?$$/g, "")

    // Entferne zusätzliche Kommentare nach Anführungszeichen
    repairedText = repairedText.replace(/"([^"]*)"([^,\]}]*)/g, '"$1"')

    // Bereinige Zeilenumbrüche und Leerzeichen
    repairedText = repairedText.replace(/\s+/g, " ").trim()

    const parsed = JSON.parse(repairedText)
    console.log("✓ JSON erfolgreich repariert und geparst")
    return parsed
  } catch (error) {
    console.error("JSON-Reparatur fehlgeschlagen:", error)
    throw new Error("JSON konnte nicht repariert werden")
  }
}

// Bereinige Künstlernamen von Kommentaren
function cleanArtistName(artist: string): string {
  return artist
    .replace(/$$.*?$$/g, "") // Entferne Kommentare in Klammern
    .replace(/\s*ft\.?\s*/gi, " ft. ") // Normalisiere "ft."
    .replace(/\s*feat\.?\s*/gi, " ft. ") // Normalisiere "feat."
    .replace(/\s*&\s*/g, " & ") // Normalisiere "&"
    .replace(/\s+/g, " ") // Entferne mehrfache Leerzeichen
    .trim()
}

// Bereinige Songtitel
function cleanSongTitle(title: string): string {
  return title
    .replace(/$$.*?$$/g, "") // Entferne Kommentare in Klammern
    .replace(/\s+/g, " ") // Entferne mehrfache Leerzeichen
    .trim()
}

// Finde beste Übereinstimmung
function findBestMatch(title: string, artist: string, results: any[]) {
  const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "")

  const normalizedTitle = normalizeString(title)
  const normalizedArtist = normalizeString(artist)

  let bestMatch = null
  let bestScore = 0

  for (const track of results) {
    const trackTitle = normalizeString(track.name)
    const trackArtist = normalizeString(track.artists[0]?.name || "")

    // Berechne Ähnlichkeitsscore
    const titleScore = calculateSimilarity(normalizedTitle, trackTitle)
    const artistScore = calculateSimilarity(normalizedArtist, trackArtist)
    const totalScore = titleScore * 0.7 + artistScore * 0.3 // Titel wichtiger als Künstler

    if (totalScore > bestScore && totalScore > 0.6) {
      // Mindest-Ähnlichkeit von 60%
      bestScore = totalScore
      bestMatch = track
    }
  }

  return bestMatch
}

// Einfache Ähnlichkeitsberechnung
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1

  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

// Levenshtein-Distanz
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
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

WICHTIG: 
- Gib NUR ein sauberes JSON-Array zurück
- Keine zusätzlichen Kommentare oder Erklärungen
- Keine Kommentare in den Künstlernamen
- Format: [{"title": "Song Name", "artist": "Artist Name"}, ...]

Beispiel:
[
  {"title": "Blinding Lights", "artist": "The Weeknd"},
  {"title": "Levitating", "artist": "Dua Lipa"}
]

Gib NUR das JSON-Array zurück, ohne Code-Blöcke oder zusätzlichen Text.
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

// Exportiere auch die Persönlichkeitsanalyse für andere Komponenten
export { analyzeMusicPersonality, type MusicPersonality } from "./music-personality"
