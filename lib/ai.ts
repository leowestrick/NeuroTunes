import { searchTracks } from "./spotify"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { analyzeMusicPersonality, type MusicPersonality } from "./music-personality"

// Debug: Überprüfe API-Schlüssel beim Import
console.log("Google AI API Key Status:", {
  exists: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  length: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.length || 0,
  prefix: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.substring(0, 10) + "..." || "not found",
})

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
    console.log("Generiere Songvorschläge mit Google Gemini...")
    console.log("API Key verfügbar:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY)

    let songSuggestions
    try {
      // Explizit den API-Schlüssel übergeben
      const model = google("gemini-1.5-flash", {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      })

      const { text } = await generateText({
        model,
        prompt,
        temperature: personality ? 0.6 : 0.7,
        maxTokens: 1000,
      })

      console.log("Gemini Antwort erhalten")
      songSuggestions = parseGeminiResponse(text)
    } catch (aiError) {
      console.error("KI-Generierung fehlgeschlagen:", aiError)
      console.log("Verwende Fallback-Playlist-Generierung")
      songSuggestions = generateFallbackPlaylist(keywords, personality)
    }

    // Validiere die Struktur der Antwort
    if (!Array.isArray(songSuggestions)) {
      console.warn("Song-Vorschläge sind kein Array, verwende Fallback")
      songSuggestions = generateFallbackPlaylist(keywords, personality)
    }

    // Suche die vorgeschlagenen Songs in Spotify
    const tracks = []
    const maxTracks = Math.min(songSuggestions.length, 20)

    console.log(`Suche ${maxTracks} Songs in Spotify...`)

    for (let i = 0; i < maxTracks; i++) {
      const song = songSuggestions[i]

      if (!song || !song.title || !song.artist) {
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
          try {
            searchResults = await searchTracks(accessToken, query, 3) // Mehr Ergebnisse für bessere Auswahl
            if (searchResults && searchResults.length > 0) {
              // Wähle das beste Ergebnis basierend auf Übereinstimmung
              const bestMatch = findBestMatch(cleanTitle, cleanArtist, searchResults)
              if (bestMatch) {
                searchResults = [bestMatch]
                break
              }
            }
          } catch (searchError) {
            console.warn(`Suche für "${query}" fehlgeschlagen:`, searchError)
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
      try {
        const additionalTracks = await searchPersonalizedTracks(accessToken, keywords, personality, 20 - tracks.length)

        for (const track of additionalTracks) {
          if (!tracks.some((t) => t.id === track.id)) {
            tracks.push(track)
          }

          if (tracks.length >= 20) {
            break
          }
        }
      } catch (searchError) {
        console.warn("Personalisierte Suche fehlgeschlagen:", searchError)
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
    try {
      console.log("Verwende Fallback-Playlist-Generierung...")
      const fallbackQuery = keywords.join(" ")
      const fallbackTracks = await searchTracks(accessToken, fallbackQuery, 20)

      return {
        tracks: fallbackTracks || [],
        personality: null,
      }
    } catch (fallbackError) {
      console.error("Auch Fallback-Suche fehlgeschlagen:", fallbackError)
      throw new Error("Playlist konnte nicht erstellt werden")
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
Du bist ein professioneller Musik-Kurator und DJ mit jahrzehntelanger Erfahrung. Erstelle eine perfekte Playlist basierend auf diesen Keywords: ${keywords.join(", ")}.

WICHTIGE REGELN:
1. Die Songs MÜSSEN thematisch und emotional zu den Keywords passen
2. Wähle nur Songs aus, die definitiv auf Spotify verfügbar sind
3. Bevorzuge bekannte, populäre Songs die Menschen kennen
4. Achte auf eine gute Mischung aus verschiedenen Jahrzehnten
5. Die Songs sollen eine zusammenhängende emotionale Reise ergeben

KEYWORD-ANALYSE:
Analysiere die Keywords "${keywords.join(", ")}" und bestimme:
- Gewünschte Stimmung (fröhlich, traurig, energetisch, entspannt, etc.)
- Passende Genres (Pop, Rock, Hip-Hop, Electronic, Indie, etc.)
- Aktivität/Kontext (Party, Workout, Entspannung, Arbeit, etc.)
- Tempo und Energie-Level

SONG-AUSWAHL STRATEGIE:
- Wenn "Party" → Upbeat Dance-Hits, bekannte Partysongs
- Wenn "entspannt/chill" → Ruhige, melodische Songs
- Wenn "Workout/Sport" → Energetische, motivierende Songs
- Wenn "traurig/melancholisch" → Emotionale Balladen
- Wenn "Sommer" → Sommerhits, gute Laune Songs
- Wenn "90er/2000er" → Hits aus dieser Zeit
- Wenn Genre genannt → Songs aus diesem Genre

BEISPIELE FÜR GUTE ZUORDNUNGEN:
- "Party, Dance" → "Uptown Funk" (Bruno Mars), "I Gotta Feeling" (Black Eyed Peas)
- "entspannt, chill" → "Stay" (Rihanna), "Skinny Love" (Bon Iver)
- "Workout, energetisch" → "Stronger" (Kanye West), "Till I Collapse" (Eminem)
- "Sommer, gute Laune" → "Good 4 U" (Olivia Rodrigo), "Blinding Lights" (The Weeknd)
- "traurig, emotional" → "Someone Like You" (Adele), "Mad World" (Gary Jules)

ERSTELLE JETZT eine Liste von 20 Songs die PERFEKT zu "${keywords.join(", ")}" passen.

Jeder Song muss:
- Thematisch zu den Keywords passen
- Emotional zur gewünschten Stimmung passen  
- Ein bekannter, auf Spotify verfügbarer Song sein
- Den richtigen Energie-Level haben

FORMAT: Gib NUR ein sauberes JSON-Array zurück:
[
  {"title": "Exakter Song Titel", "artist": "Exakter Künstler Name"},
  {"title": "Exakter Song Titel", "artist": "Exakter Künstler Name"}
]

WICHTIG: 
- Keine Kommentare oder Erklärungen
- Keine zusätzlichen Felder im JSON
- Exakte Song- und Künstlernamen verwenden
- NUR das JSON-Array, sonst nichts
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
  console.log("Generiere Fallback-Playlist basierend auf Keywords:", keywords)

  // Keyword-basierte Song-Zuordnung
  const keywordSongs = {
    entspannt: [
      { title: "Weightless", artist: "Marconi Union" },
      { title: "Clair de Lune", artist: "Claude Debussy" },
      { title: "Mad World", artist: "Gary Jules" },
      { title: "The Night We Met", artist: "Lord Huron" },
      { title: "Holocene", artist: "Bon Iver" },
    ],
    energetisch: [
      { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars" },
      { title: "Can't Stop the Feeling!", artist: "Justin Timberlake" },
      { title: "Thunder", artist: "Imagine Dragons" },
      { title: "High Hopes", artist: "Panic! At The Disco" },
      { title: "Believer", artist: "Imagine Dragons" },
    ],
    party: [
      { title: "I Gotta Feeling", artist: "The Black Eyed Peas" },
      { title: "Party Rock Anthem", artist: "LMFAO" },
      { title: "Good as Hell", artist: "Lizzo" },
      { title: "Levitating", artist: "Dua Lipa" },
      { title: "Blinding Lights", artist: "The Weeknd" },
    ],
    sommer: [
      { title: "Summer", artist: "Calvin Harris" },
      { title: "Cruel Summer", artist: "Taylor Swift" },
      { title: "California Gurls", artist: "Katy Perry" },
      { title: "Summertime Magic", artist: "Childish Gambino" },
      { title: "Good 4 U", artist: "Olivia Rodrigo" },
    ],
    workout: [
      { title: "Stronger", artist: "Kanye West" },
      { title: "Till I Collapse", artist: "Eminem" },
      { title: "Eye of the Tiger", artist: "Survivor" },
      { title: "Pump It", artist: "The Black Eyed Peas" },
      { title: "Work Out", artist: "J. Cole" },
    ],
    chill: [
      { title: "Stay", artist: "Rihanna" },
      { title: "Electric Feel", artist: "MGMT" },
      { title: "Midnight City", artist: "M83" },
      { title: "Breathe Me", artist: "Sia" },
      { title: "Skinny Love", artist: "Bon Iver" },
    ],
  }

  const fallbackSongs = []

  // Sammle Songs basierend auf Keywords
  keywords.forEach((keyword) => {
    const lowerKeyword = keyword.toLowerCase()
    Object.entries(keywordSongs).forEach(([key, songs]) => {
      if (lowerKeyword.includes(key) || key.includes(lowerKeyword)) {
        fallbackSongs.push(...songs)
      }
    })
  })

  // Füge Standard-Songs hinzu wenn keine spezifischen gefunden wurden
  if (fallbackSongs.length < 10) {
    fallbackSongs.push(
      { title: "Shape of You", artist: "Ed Sheeran" },
      { title: "Anti-Hero", artist: "Taylor Swift" },
      { title: "As It Was", artist: "Harry Styles" },
      { title: "God's Plan", artist: "Drake" },
      { title: "HUMBLE.", artist: "Kendrick Lamar" },
      { title: "Don't Stop Believin'", artist: "Journey" },
      { title: "Bohemian Rhapsody", artist: "Queen" },
      { title: "Sweet Child O' Mine", artist: "Guns N' Roses" },
      { title: "Mr. Brightside", artist: "The Killers" },
      { title: "Flowers", artist: "Miley Cyrus" },
    )
  }

  // Personalisiere basierend auf Persönlichkeit falls verfügbar
  if (personality) {
    const topGenres = personality.genres.slice(0, 3).map((g) => g.genre)

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

  // Entferne Duplikate und limitiere auf 20
  const uniqueSongs = fallbackSongs.filter(
    (song, index, self) => index === self.findIndex((s) => s.title === song.title && s.artist === song.artist),
  )

  return uniqueSongs.slice(0, 20)
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

export function generatePersonalityPrompt(personality: MusicPersonality, keywords: string[]): string {
  const topGenres = personality.genres
    .slice(0, 5)
    .map((g) => g.genre)
    .join(", ")
  const audioProfile = personality.audioFeatures
  const moodProfile = personality.moodProfile
  const insights = personality.personalityInsights

  return `
Du bist ein KI-Musik-Experte, der eine hochpersonalisierte Playlist erstellt.

NUTZER-KEYWORDS: ${keywords.join(", ")}

NUTZER-MUSIKPERSÖNLICHKEIT:
- Lieblings-Genres: ${topGenres}
- Persönlichkeitstyp: ${insights.musicPersonalityType}
- Dominante Stimmung: ${moodProfile.dominantMood}
- Energie-Präferenz: ${(audioProfile.energy * 100).toFixed(0)}% (0=ruhig, 100=sehr energetisch)
- Positivitäts-Level: ${(audioProfile.valence * 100).toFixed(0)}% (0=melancholisch, 100=fröhlich)
- Tanzbarkeit: ${(audioProfile.danceability * 100).toFixed(0)}%
- Bevorzugtes Tempo: ~${audioProfile.tempo.toFixed(0)} BPM
- Mainstream vs. Nische: ${(personality.artistDiversity.mainstreamFactor * 100).toFixed(0)}% mainstream

AUFGABE:
Erstelle eine Playlist von 20 Songs, die SOWOHL zu den Keywords "${keywords.join(", ")}" ALS AUCH zur Musikpersönlichkeit passt.

PERSONALISIERUNGS-REGELN:
1. GENRE-MIX: 70% aus bevorzugten Genres (${topGenres}), 30% passende andere Genres
2. ENERGIE-MATCHING: Orientiere dich am Energie-Level von ${(audioProfile.energy * 100).toFixed(0)}%
3. STIMMUNGS-ALIGNMENT: Berücksichtige die dominante Stimmung "${moodProfile.dominantMood}"
4. TEMPO-ANPASSUNG: Bevorzuge Songs um ${audioProfile.tempo.toFixed(0)} BPM (±20 BPM)
5. MAINSTREAM-BALANCE: ${personality.artistDiversity.mainstreamFactor > 0.6 ? "Fokussiere auf populäre, bekannte Songs" : "Mische bekannte und weniger bekannte Songs"}

KEYWORD-INTERPRETATION für "${keywords.join(", ")}":
- Analysiere die emotionale Bedeutung der Keywords
- Bestimme die gewünschte Aktivität/Situation
- Wähle Songs die thematisch UND zur Persönlichkeit passen

SONG-AUSWAHL:
- Jeder Song muss zu den Keywords UND zur Persönlichkeit passen
- Verwende exakte, bekannte Song- und Künstlernamen
- Achte auf gute Übergänge zwischen den Songs
- Erstelle eine emotionale Reise durch die Playlist

BEISPIEL-LOGIK:
Wenn Keywords="Party, Sommer" + Nutzer mag Pop/Dance + hohe Energie:
→ "Levitating" (Dua Lipa), "Good 4 U" (Olivia Rodrigo), "Blinding Lights" (The Weeknd)

Wenn Keywords="entspannt, Abend" + Nutzer mag Indie/Alternative + niedrige Energie:
→ "Holocene" (Bon Iver), "Mad World" (Gary Jules), "The Night We Met" (Lord Huron)

FORMAT: Gib NUR das JSON-Array zurück:
[
  {"title": "Exakter Song Titel", "artist": "Exakter Künstler Name"},
  {"title": "Exakter Song Titel", "artist": "Exakter Künstler Name"}
]

WICHTIG: Keine Erklärungen, nur das JSON-Array!
`
}

// Exportiere auch die Persönlichkeitsanalyse für andere Komponenten
export { analyzeMusicPersonality, type MusicPersonality } from "./music-personality"
