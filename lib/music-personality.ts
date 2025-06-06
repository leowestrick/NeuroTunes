import {
  getTopArtists,
  getTopTracks,
  getRecentlyPlayed,
  getAudioFeatures,
  getSavedTracks,
  getFollowedArtists,
} from "./spotify"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export interface MusicPersonality {
  genres: GenrePreference[]
  audioFeatures: AudioFeatureProfile
  listeningPatterns: ListeningPattern
  artistDiversity: ArtistDiversityProfile
  temporalPreferences: TemporalPreference
  moodProfile: MoodProfile
  discoveryProfile: DiscoveryProfile
  personalityInsights: PersonalityInsights
  rawDataSummary: RawDataSummary
}

export interface GenrePreference {
  genre: string
  weight: number
  confidence: number
}

export interface AudioFeatureProfile {
  energy: number
  valence: number
  danceability: number
  acousticness: number
  instrumentalness: number
  tempo: number
  loudness: number
  speechiness: number
  liveness: number
  mode: number
}

export interface ListeningPattern {
  averageSessionLength: number
  skipRate: number
  repeatListening: number
  diversityScore: number
  recentActivityLevel: number
}

export interface ArtistDiversityProfile {
  mainGenres: string[]
  nicheFactor: number
  mainstreamFactor: number
  internationalFactor: number
  artistCount: number
  genreSpread: number
}

export interface TemporalPreference {
  morningMood: string
  afternoonMood: string
  eveningMood: string
  weekendVsWeekday: string
  listeningTimeDistribution: Record<string, number>
}

export interface MoodProfile {
  dominantMood: string
  moodVariability: number
  emotionalRange: string[]
  energyConsistency: number
}

export interface DiscoveryProfile {
  openness: number
  preferredDiscoveryMethod: string
  newVsOld: number
  explorationRate: number
}

export interface PersonalityInsights {
  musicPersonalityType: string
  listeningBehavior: string
  moodDescription: string
  discoveryStyle: string
  socialAspect: string
  recommendations: string[]
}

export interface RawDataSummary {
  topArtistsCount: number
  topTracksCount: number
  recentTracksCount: number
  savedTracksCount: number
  followedArtistsCount: number
  audioFeaturesCount: number
  uniqueGenresCount: number
  dataQuality: string
}

export async function analyzeMusicPersonality(accessToken: string): Promise<MusicPersonality> {
  try {
    console.log("🎵 Starte umfassende Musikpersönlichkeitsanalyse...")

    // Sammle alle relevanten Daten mit verbesserter Fehlerbehandlung
    const [
      topArtistsShort,
      topArtistsMedium,
      topArtistsLong,
      topTracksShort,
      topTracksMedium,
      topTracksLong,
      recentlyPlayed,
      savedTracks,
      followedArtists,
    ] = await Promise.allSettled([
      getTopArtists(accessToken, "short_term", 50),
      getTopArtists(accessToken, "medium_term", 50),
      getTopArtists(accessToken, "long_term", 50),
      getTopTracks(accessToken, "short_term", 50),
      getTopTracks(accessToken, "medium_term", 50),
      getTopTracks(accessToken, "long_term", 50),
      getRecentlyPlayed(accessToken, 50),
      getSavedTracks(accessToken, 50),
      getFollowedArtists(accessToken, 50),
    ])

    // Extrahiere erfolgreiche Daten
    const extractData = (result: PromiseSettledResult<any>) => {
      if (result.status === "fulfilled") {
        return result.value
      } else {
        console.warn("API-Aufruf fehlgeschlagen:", result.reason)
        return { items: [] }
      }
    }

    const userData = {
      topArtistsShort: extractData(topArtistsShort),
      topArtistsMedium: extractData(topArtistsMedium),
      topArtistsLong: extractData(topArtistsLong),
      topTracksShort: extractData(topTracksShort),
      topTracksMedium: extractData(topTracksMedium),
      topTracksLong: extractData(topTracksLong),
      recentlyPlayed: extractData(recentlyPlayed),
      savedTracks: extractData(savedTracks),
      followedArtists: extractData(followedArtists),
    }

    // Validiere Datenqualität
    const dataQuality = validateDataQuality(userData)
    console.log("📊 Datenqualität:", dataQuality)

    if (dataQuality.score < 0.3) {
      throw new Error("Nicht genügend Spotify-Daten für eine aussagekräftige Persönlichkeitsanalyse verfügbar")
    }

    // Sammle Track-IDs für Audio-Feature-Analyse
    const allTrackIds = collectTrackIds(userData)
    console.log(`🎼 Sammle Audio-Features für ${allTrackIds.length} Tracks...`)

    // Audio-Features mit robuster Fehlerbehandlung
    let audioFeatures = { audio_features: [] }
    if (allTrackIds.length > 0) {
      try {
        audioFeatures = await getAudioFeatures(accessToken, allTrackIds)
        console.log(`✅ Audio-Features erhalten: ${audioFeatures.audio_features?.length || 0} Features`)
      } catch (error) {
        console.warn("⚠️ Audio-Features konnten nicht geladen werden:", error)
      }
    }

    // Führe detaillierte Analysen durch
    console.log("🔍 Führe Persönlichkeitsanalysen durch...")

    const genres = analyzeGenrePreferences(userData)
    const audioProfile = analyzeAudioFeatures(audioFeatures.audio_features || [])
    const listeningPatterns = analyzeListeningPatterns(userData)
    const artistDiversity = analyzeArtistDiversity(userData)
    const temporalPrefs = analyzeTemporalPreferences(userData.recentlyPlayed)
    const moodProfile = analyzeMoodProfile(audioFeatures.audio_features || [], genres)
    const discoveryProfile = analyzeDiscoveryProfile(userData)

    // Erstelle Rohdaten-Zusammenfassung
    const rawDataSummary: RawDataSummary = {
      topArtistsCount: (userData.topArtistsShort.items?.length || 0) + (userData.topArtistsMedium.items?.length || 0),
      topTracksCount: (userData.topTracksShort.items?.length || 0) + (userData.topTracksMedium.items?.length || 0),
      recentTracksCount: userData.recentlyPlayed.items?.length || 0,
      savedTracksCount: userData.savedTracks.items?.length || 0,
      followedArtistsCount: userData.followedArtists.artists?.items?.length || 0,
      audioFeaturesCount: audioFeatures.audio_features?.length || 0,
      uniqueGenresCount: genres.length,
      dataQuality: dataQuality.level,
    }

    console.log("🤖 Führe KI-basierte Persönlichkeitsanalyse durch...")

    // KI-basierte Persönlichkeitsanalyse mit echten Daten
    const personalityInsights = await generatePersonalityInsights({
      genres,
      audioProfile,
      listeningPatterns,
      artistDiversity,
      temporalPrefs,
      moodProfile,
      discoveryProfile,
      rawDataSummary,
      userData,
    })

    console.log("✅ Musikpersönlichkeitsanalyse abgeschlossen")

    return {
      genres,
      audioFeatures: audioProfile,
      listeningPatterns,
      artistDiversity,
      temporalPreferences: temporalPrefs,
      moodProfile,
      discoveryProfile,
      personalityInsights,
      rawDataSummary,
    }
  } catch (error) {
    console.error("❌ Fehler bei der Musik-Persönlichkeitsanalyse:", error)
    throw error
  }
}

function validateDataQuality(userData: any) {
  let score = 0
  const issues = []

  // Bewerte verfügbare Datenquellen
  if (userData.topArtistsShort.items?.length > 0) score += 0.2
  else issues.push("Keine aktuellen Top-Künstler")

  if (userData.topTracksMedium.items?.length > 0) score += 0.2
  else issues.push("Keine mittelfristigen Top-Tracks")

  if (userData.recentlyPlayed.items?.length > 0) score += 0.2
  else issues.push("Keine kürzlich gespielten Songs")

  if (userData.savedTracks.items?.length > 0) score += 0.15
  else issues.push("Keine gespeicherten Songs")

  if (userData.followedArtists.artists?.items?.length > 0) score += 0.1
  else issues.push("Keine gefolgten Künstler")

  // Bewerte Datenqualität
  const totalArtists = (userData.topArtistsShort.items?.length || 0) + (userData.topArtistsMedium.items?.length || 0)
  const totalTracks = (userData.topTracksShort.items?.length || 0) + (userData.topTracksMedium.items?.length || 0)

  if (totalArtists >= 20) score += 0.1
  if (totalTracks >= 20) score += 0.05

  let level = "schlecht"
  if (score >= 0.8) level = "ausgezeichnet"
  else if (score >= 0.6) level = "gut"
  else if (score >= 0.4) level = "ausreichend"
  else if (score >= 0.3) level = "mangelhaft"

  return { score, level, issues }
}

function collectTrackIds(userData: any): string[] {
  const trackIds = new Set<string>()

  // Sammle Track-IDs aus verschiedenen Quellen
  const sources = [
    userData.topTracksShort.items || [],
    userData.topTracksMedium.items || [],
    userData.topTracksLong.items || [],
    (userData.recentlyPlayed.items || []).map((item: any) => item.track),
    (userData.savedTracks.items || []).map((item: any) => item.track),
  ]

  sources.forEach((tracks) => {
    tracks.forEach((track: any) => {
      if (track?.id && typeof track.id === "string") {
        trackIds.add(track.id)
      }
    })
  })

  return Array.from(trackIds).slice(0, 100) // Limitiere auf 100 für API-Limits
}

async function generatePersonalityInsights(analysisData: any): Promise<PersonalityInsights> {
  // Überprüfe ob Google AI verfügbar ist
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.log("Google AI API Key nicht verfügbar, verwende Fallback-Persönlichkeitsanalyse")
    return generateFallbackPersonalityInsights(analysisData)
  }

  try {
    // Erstelle detaillierten Prompt mit echten Benutzerdaten
    const prompt = createDetailedPersonalityPrompt(analysisData)

    const model = google("gemini-1.5-flash", {
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    })

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.7,
      maxTokens: 1000,
    })

    console.log("🤖 KI-Persönlichkeitsanalyse erhalten")

    // Parse die JSON-Antwort
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
      const insights = JSON.parse(cleanedText)

      // Validiere die Struktur
      if (!insights.musicPersonalityType || !insights.listeningBehavior) {
        throw new Error("Unvollständige Persönlichkeitsanalyse")
      }

      return insights
    } catch (parseError) {
      console.error("Fehler beim Parsen der Persönlichkeitsanalyse:", parseError)
      console.log("Rohe KI-Antwort:", text)
      return generateFallbackPersonalityInsights(analysisData)
    }
  } catch (error) {
    console.error("Fehler bei der KI-Persönlichkeitsanalyse:", error)
    return generateFallbackPersonalityInsights(analysisData)
  }
}

function createDetailedPersonalityPrompt(data: any): string {
  const { genres, audioProfile, listeningPatterns, artistDiversity, userData, rawDataSummary } = data

  // Extrahiere konkrete Beispiele aus den Benutzerdaten
  const topArtistsShort = userData.topArtistsShort.items?.slice(0, 10) || []
  const topTracksShort = userData.topTracksShort.items?.slice(0, 10) || []
  const recentTracks = userData.recentlyPlayed.items?.slice(0, 10) || []

  const topArtistNames = topArtistsShort.map((artist: any) => artist.name).join(", ")
  const topTrackNames = topTracksShort.map((track: any) => `"${track.name}" von ${track.artists[0]?.name}`).join(", ")
  const recentTrackNames = recentTracks
      .map((item: any) => `"${item.track?.name}" von ${item.track?.artists[0]?.name}`)
      .join(", ")

  // Berechne durchschnittliche Popularität
  const avgPopularity =
      topArtistsShort.reduce((sum: number, artist: any) => sum + (artist.popularity || 0), 0) / topArtistsShort.length ||
      0

  return `
Du bist ein Experte für Musikpsychologie und Persönlichkeitsanalyse. Analysiere die folgenden ECHTEN Spotify-Hördaten eines spezifischen Nutzers und erstelle ein detailliertes, individuelles Musikpersönlichkeitsprofil.

**ECHTE BENUTZERDATEN:**

**Datenqualität:** ${rawDataSummary.dataQuality} (${rawDataSummary.topArtistsCount} Künstler, ${rawDataSummary.topTracksCount} Tracks analysiert)

**Aktuelle Top-Künstler (letzte 4 Wochen):**
${topArtistNames || "Keine Daten verfügbar"}

**Aktuelle Top-Songs (letzte 4 Wochen):**
${topTrackNames || "Keine Daten verfügbar"}

**Kürzlich gehörte Songs:**
${recentTrackNames || "Keine Daten verfügbar"}

**Detaillierte Genre-Analyse:**
${genres
      .slice(0, 15)
      .map((g: any) => `${g.genre}: ${g.weight.toFixed(1)} Punkte (${(g.confidence * 100).toFixed(0)}% Konfidenz)`)
      .join(", ")}

**Audio-Charakteristika (basierend auf ${rawDataSummary.audioFeaturesCount} analysierten Songs):**
- Energie-Level: ${(audioProfile.energy * 100).toFixed(1)}% (0=sehr ruhig, 100=sehr energetisch)
- Emotionale Positivität: ${(audioProfile.valence * 100).toFixed(1)}% (0=melancholisch, 100=euphorisch)
- Tanzbarkeit: ${(audioProfile.danceability * 100).toFixed(1)}% (0=nicht tanzbar, 100=sehr tanzbar)
- Akustik-Anteil: ${(audioProfile.acousticness * 100).toFixed(1)}% (0=elektronisch, 100=akustisch)
- Instrumentalität: ${(audioProfile.instrumentalness * 100).toFixed(1)}% (0=viel Gesang, 100=instrumental)
- Durchschnittstempo: ${audioProfile.tempo.toFixed(0)} BPM
- Lautstärke-Präferenz: ${audioProfile.loudness.toFixed(1)} dB
- Sprach-Anteil: ${(audioProfile.speechiness * 100).toFixed(1)}% (0=Musik, 100=Sprache/Rap)
- Live-Aufnahmen: ${(audioProfile.liveness * 100).toFixed(1)}% (0=Studio, 100=Live)

**Hörverhalten-Analyse:**
- Wiederholungsrate: ${(listeningPatterns.repeatListening * 100).toFixed(1)}% (Wie oft werden Songs wiederholt)
- Musik-Diversität: ${(listeningPatterns.diversityScore * 100).toFixed(1)}% (Vielfalt der gehörten Künstler)
- Aktivitätslevel: ${(listeningPatterns.recentActivityLevel * 100).toFixed(1)}% (Wie aktiv hört der Nutzer Musik)

**Künstler-Diversität:**
- Mainstream-Faktor: ${(artistDiversity.mainstreamFactor * 100).toFixed(1)}% (Durchschnittliche Künstler-Popularität: ${avgPopularity.toFixed(0)}/100)
- Nischen-Faktor: ${(artistDiversity.nicheFactor * 100).toFixed(1)}% (Vorliebe für unbekannte Künstler)
- Genre-Vielfalt: ${artistDiversity.genreSpread.toFixed(1)} (Anzahl verschiedener Genres)
- Gefolgte Künstler: ${rawDataSummary.followedArtistsCount}
- Gespeicherte Songs: ${rawDataSummary.savedTracksCount}

**Stimmungsprofil:**
- Dominante Stimmung: ${data.moodProfile.dominantMood}
- Emotionale Variabilität: ${(data.moodProfile.moodVariability * 100).toFixed(1)}% (Wie stark schwankt die Stimmung)
- Energie-Konsistenz: ${(data.moodProfile.energyConsistency * 100).toFixed(1)}% (Wie konsistent ist das Energie-Level)

**Entdeckungsverhalten:**
- Offenheit für Neues: ${(data.discoveryProfile.openness * 100).toFixed(1)}% (Wie oft werden neue Songs entdeckt)
- Neue vs. Alte Musik: ${(data.discoveryProfile.newVsOld * 100).toFixed(1)}% neue Musik
- Explorations-Rate: ${(data.discoveryProfile.explorationRate * 100).toFixed(1)}% (Wie experimentierfreudig)

**AUFGABE:**
Erstelle basierend auf diesen ECHTEN, SPEZIFISCHEN Daten eine tiefgreifende, individuelle Musikpersönlichkeitsanalyse. Analysiere die konkreten Muster und erstelle präzise Insights über:

1. **Musikpersönlichkeitstyp** - Basierend auf den echten Hördaten (z.B. "Energetischer Mainstream-Explorer", "Melancholischer Indie-Purist", "Vielseitiger Genre-Hopper")

2. **Hörverhalten** - Wie diese spezifische Person Musik konsumiert (basierend auf Wiederholungsrate, Diversität, Aktivität)

3. **Stimmungsbeschreibung** - Welche emotionalen Bedürfnisse die Musik erfüllt (basierend auf Valenz, Energie, dominanter Stimmung)

4. **Entdeckungsstil** - Wie diese Person neue Musik findet (basierend auf Offenheit, Mainstream-Faktor, Genre-Vielfalt)

5. **Sozialer Aspekt** - Mainstream vs. Underground Präferenzen, Sharing-Verhalten (basierend auf Künstler-Popularität, Nischen-Faktor)

6. **Empfehlungen** - 5 konkrete, personalisierte Tipps basierend auf den spezifischen Daten

**WICHTIG:**
- Verwende die ECHTEN Daten, nicht generische Aussagen
- Beziehe dich auf konkrete Künstler und Songs wenn relevant
- Berücksichtige die Datenqualität (${rawDataSummary.dataQuality})
- Sei spezifisch und individuell, nicht allgemein
- Erkenne echte Muster in den Hördaten

Formatiere die Antwort als JSON:
{
  "musicPersonalityType": "Spezifischer, individueller Typ basierend auf echten Daten",
  "listeningBehavior": "Konkrete Beschreibung basierend auf Hörmustern (2-3 Sätze)",
  "moodDescription": "Spezifische emotionale Musiknutzung basierend auf Audio-Features (2-3 Sätze)",
  "discoveryStyle": "Individueller Entdeckungsstil basierend auf Daten (2-3 Sätze)",
  "socialAspect": "Spezifisches soziales Musikverhalten basierend auf Mainstream-Faktor (2-3 Sätze)",
  "recommendations": ["Personalisierte Empfehlung 1", "Personalisierte Empfehlung 2", "Personalisierte Empfehlung 3", "Personalisierte Empfehlung 4", "Personalisierte Empfehlung 5"]
}

Gib NUR das JSON zurück, ohne zusätzlichen Text.
`
}

function generateFallbackPersonalityInsights(analysisData: any): PersonalityInsights {
  const { audioProfile, artistDiversity, discoveryProfile, genres, rawDataSummary } = analysisData

  const energy = audioProfile.energy || 0.5
  const valence = audioProfile.valence || 0.5
  const openness = discoveryProfile.openness || 0.5
  const mainstream = artistDiversity.mainstreamFactor || 0.5

  // Bestimme Persönlichkeitstyp basierend auf echten Daten
  let personalityType = "Ausgewogener Hörer"
  if (energy > 0.7 && openness > 0.6) personalityType = "Energetischer Entdecker"
  else if (valence < 0.4 && energy < 0.5) personalityType = "Melancholischer Träumer"
  else if (mainstream > 0.7) personalityType = "Mainstream Enthusiast"
  else if (openness > 0.8) personalityType = "Musik Explorer"
  else if (genres.length > 10) personalityType = "Genre-Hopper"

  const topGenres = genres
      .slice(0, 3)
      .map((g: any) => g.genre)
      .join(", ")

  return {
    musicPersonalityType: personalityType,
    listeningBehavior: `Du hörst Musik mit einer durchschnittlichen Energie von ${(energy * 100).toFixed(0)}% und zeigst eine ${openness > 0.6 ? "hohe" : "moderate"} Offenheit für neue Entdeckungen. Deine Hörgewohnheiten basieren auf ${rawDataSummary.topTracksCount} analysierten Top-Tracks und zeigen eine ${analysisData.listeningPatterns.diversityScore > 0.5 ? "vielfältige" : "fokussierte"} Musikauswahl.`,
    moodDescription: `Deine Musik spiegelt eine ${valence > 0.6 ? "überwiegend positive" : valence < 0.4 ? "eher melancholische" : "ausgewogene"} Stimmung wider (${(valence * 100).toFixed(0)}% Positivität). Du nutzt Musik wahrscheinlich zur ${energy > 0.6 ? "Energiegewinnung und Motivation" : "Entspannung und Reflexion"} mit einem durchschnittlichen Tempo von ${audioProfile.tempo?.toFixed(0) || 120} BPM.`,
    discoveryStyle: `Mit einer Offenheit von ${(openness * 100).toFixed(0)}% für neue Musik und ${genres.length} verschiedenen Genres entdeckst du ${openness > 0.7 ? "aktiv und regelmäßig" : openness > 0.4 ? "gelegentlich" : "selten"} neue Künstler. Deine Top-Genres sind: ${topGenres}.`,
    socialAspect: `Du bewegst dich ${mainstream > 0.6 ? "hauptsächlich im Mainstream" : mainstream < 0.4 ? "eher in Nischenbereichen" : "zwischen Mainstream und Nische"} mit einem Mainstream-Faktor von ${(mainstream * 100).toFixed(0)}%. Du hast ${rawDataSummary.followedArtistsCount} gefolgte Künstler und ${rawDataSummary.savedTracksCount} gespeicherte Songs.`,
    recommendations: [
      openness < 0.5
          ? `Probiere wöchentlich einen neuen Künstler aus deinen Lieblings-Genres (${topGenres})`
          : "Erkunde verwandte Genres zu deinen aktuellen Favoriten",
      `Nutze Spotify's 'Discover Weekly' für personalisierte Empfehlungen basierend auf deinen ${rawDataSummary.topArtistsCount} Top-Künstlern`,
      energy > 0.6
          ? "Erstelle separate Playlists für verschiedene Aktivitäten und Energie-Level"
          : "Experimentiere mit energiereicherer Musik für Workouts",
      `Folge mehr Künstlern (aktuell: ${rawDataSummary.followedArtistsCount}) um über neue Releases informiert zu bleiben`,
      mainstream > 0.7
          ? `Entdecke Underground-Künstler in deinen Lieblings-Genres: ${topGenres}`
          : "Teile deine Nischenfunde mit Freunden über Spotify",
    ],
  }
}

function analyzeGenrePreferences(userData: any): GenrePreference[] {
  const genreCount: Record<string, number> = {}
  const genreRecency: Record<string, number> = {}
  const genrePopularity: Record<string, number[]> = {}

  // Analysiere Genres aus verschiedenen Zeiträumen mit unterschiedlicher Gewichtung
  const artistSources = [
    { data: userData.topArtistsShort, weight: 3, recency: 3 }, // Neueste Daten höchste Gewichtung
    { data: userData.topArtistsMedium, weight: 2, recency: 2 },
    { data: userData.topArtistsLong, weight: 1, recency: 1 },
  ]

  artistSources.forEach(({ data, weight, recency }) => {
    if (data.items) {
      data.items.forEach((artist: any, index: number) => {
        const positionWeight = 1 - index / data.items.length // Höhere Positionen wichtiger
        const popularity = artist.popularity || 0

        artist.genres.forEach((genre: string) => {
          const totalWeight = weight * positionWeight
          genreCount[genre] = (genreCount[genre] || 0) + totalWeight
          genreRecency[genre] = Math.max(genreRecency[genre] || 0, recency)

          if (!genrePopularity[genre]) genrePopularity[genre] = []
          genrePopularity[genre].push(popularity)
        })
      })
    }
  })

  return Object.entries(genreCount)
      .map(([genre, count]) => ({
        genre,
        weight: count,
        confidence: Math.min(genreRecency[genre] / 3, 1), // Normalisiere Konfidenz
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 25) // Top 25 Genres für bessere Analyse
}

function analyzeAudioFeatures(audioFeatures: any[]): AudioFeatureProfile {
  const validFeatures = audioFeatures.filter((f) => f !== null && f !== undefined)

  if (validFeatures.length === 0) {
    console.warn("Keine Audio-Features verfügbar, verwende Standardwerte")
    return {
      energy: 0.5,
      valence: 0.5,
      danceability: 0.5,
      acousticness: 0.5,
      instrumentalness: 0.5,
      tempo: 120,
      loudness: -10,
      speechiness: 0.1,
      liveness: 0.1,
      mode: 0.5,
    }
  }

  const avg = (key: string) => {
    const values = validFeatures.map((f) => f[key]).filter((v) => v !== null && v !== undefined)
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0.5
  }

  console.log(`📊 Audio-Features analysiert: ${validFeatures.length} Tracks`)

  return {
    energy: avg("energy"),
    valence: avg("valence"),
    danceability: avg("danceability"),
    acousticness: avg("acousticness"),
    instrumentalness: avg("instrumentalness"),
    tempo: avg("tempo"),
    loudness: avg("loudness"),
    speechiness: avg("speechiness"),
    liveness: avg("liveness"),
    mode: avg("mode"),
  }
}

function analyzeListeningPatterns(userData: any): ListeningPattern {
  const recentTracks = userData.recentlyPlayed.items || []
  const shortTermTracks = userData.topTracksShort.items || []
  const mediumTermTracks = userData.topTracksMedium.items || []

  // Berechne Wiederholungsrate basierend auf kürzlich gespielten Tracks
  const trackCounts: Record<string, number> = {}
  recentTracks.forEach((item: any) => {
    const trackId = item.track?.id
    if (trackId) {
      trackCounts[trackId] = (trackCounts[trackId] || 0) + 1
    }
  })

  const totalUniqueTracks = Object.keys(trackCounts).length
  const repeatedTracks = Object.values(trackCounts).filter((count) => count > 1).length
  const repeatListening = totalUniqueTracks > 0 ? repeatedTracks / totalUniqueTracks : 0

  // Berechne Diversität basierend auf Künstler-Vielfalt
  const uniqueArtists = new Set()
  recentTracks.forEach((item: any) => {
    if (item.track?.artists?.[0]?.id) {
      uniqueArtists.add(item.track.artists[0].id)
    }
  })

  const diversityScore = recentTracks.length > 0 ? uniqueArtists.size / recentTracks.length : 0

  // Berechne Aktivitätslevel
  const recentActivityLevel = Math.min(recentTracks.length / 50, 1) // Normalisiert auf 0-1

  console.log(
      `🎧 Hörverhalten: ${repeatedTracks}/${totalUniqueTracks} wiederholte Tracks, ${uniqueArtists.size} verschiedene Künstler`,
  )

  return {
    averageSessionLength: recentTracks.length, // Vereinfacht
    skipRate: 0.1, // Placeholder - würde echte Daten benötigen
    repeatListening,
    diversityScore,
    recentActivityLevel,
  }
}

function analyzeArtistDiversity(userData: any): ArtistDiversityProfile {
  const allArtists = [
    ...(userData.topArtistsShort.items || []),
    ...(userData.topArtistsMedium.items || []),
    ...(userData.topArtistsLong.items || []),
  ]

  const uniqueArtists = Array.from(new Map(allArtists.map((artist) => [artist.id, artist])).values())
  const allGenres = uniqueArtists.flatMap((artist: any) => artist.genres || [])

  // Hauptgenres identifizieren
  const genreCount: Record<string, number> = {}
  allGenres.forEach((genre: string) => {
    genreCount[genre] = (genreCount[genre] || 0) + 1
  })

  const mainGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([genre]) => genre)

  // Mainstream vs. Nische berechnen
  const popularityScores = uniqueArtists.map((artist: any) => artist.popularity || 0).filter((p) => p > 0)
  const avgPopularity =
      popularityScores.length > 0 ? popularityScores.reduce((sum, pop) => sum + pop, 0) / popularityScores.length : 50
  const mainstreamFactor = avgPopularity / 100

  // Nischenfaktor (inverse von Mainstream)
  const nicheFactor = 1 - mainstreamFactor

  // Genre-Vielfalt
  const genreSpread = Object.keys(genreCount).length

  console.log(
      `🎨 Künstler-Diversität: ${uniqueArtists.length} Künstler, ${genreSpread} Genres, ${avgPopularity.toFixed(0)}% Mainstream`,
  )

  return {
    mainGenres,
    nicheFactor,
    mainstreamFactor,
    internationalFactor: Math.min(genreSpread / 50, 1), // Vereinfacht
    artistCount: uniqueArtists.length,
    genreSpread,
  }
}

function analyzeTemporalPreferences(recentlyPlayed: any): TemporalPreference {
  const items = recentlyPlayed.items || []

  // Gruppiere nach Tageszeit
  const timeGroups = {
    morning: [],
    afternoon: [],
    evening: [],
    night: [],
  }

  const timeDistribution = { morning: 0, afternoon: 0, evening: 0, night: 0 }

  items.forEach((item: any) => {
    if (item.played_at) {
      const hour = new Date(item.played_at).getHours()
      let period = "night"

      if (hour >= 6 && hour < 12) period = "morning"
      else if (hour >= 12 && hour < 18) period = "afternoon"
      else if (hour >= 18 && hour < 24) period = "evening"

      timeGroups[period as keyof typeof timeGroups].push(item)
      timeDistribution[period as keyof typeof timeDistribution]++
    }
  })

  // Normalisiere Verteilung
  const total = Object.values(timeDistribution).reduce((sum, count) => sum + count, 0)
  if (total > 0) {
    Object.keys(timeDistribution).forEach((key) => {
      timeDistribution[key as keyof typeof timeDistribution] /= total
    })
  }

  console.log("⏰ Zeitliche Präferenzen:", timeDistribution)

  return {
    morningMood: timeGroups.morning.length > 0 ? "energetic" : "calm",
    afternoonMood: timeGroups.afternoon.length > 0 ? "focused" : "relaxed",
    eveningMood: timeGroups.evening.length > 0 ? "chill" : "party",
    weekendVsWeekday: "similar", // Placeholder
    listeningTimeDistribution: timeDistribution,
  }
}

function analyzeMoodProfile(audioFeatures: any[], genres: GenrePreference[]): MoodProfile {
  const validFeatures = audioFeatures.filter((f) => f !== null && f !== undefined)

  if (validFeatures.length === 0) {
    return {
      dominantMood: "balanced",
      moodVariability: 0.5,
      emotionalRange: ["neutral"],
      energyConsistency: 0.5,
    }
  }

  const valenceValues = validFeatures.map((f) => f.valence).filter((v) => v !== null)
  const energyValues = validFeatures.map((f) => f.energy).filter((v) => v !== null)

  const avgValence = valenceValues.reduce((sum, val) => sum + val, 0) / valenceValues.length
  const avgEnergy = energyValues.reduce((sum, val) => sum + val, 0) / energyValues.length

  // Bestimme dominante Stimmung basierend auf echten Daten
  let dominantMood = "balanced"
  if (avgValence > 0.7 && avgEnergy > 0.7) dominantMood = "euphoric"
  else if (avgValence > 0.6 && avgEnergy > 0.6) dominantMood = "happy"
  else if (avgValence < 0.4 && avgEnergy < 0.4) dominantMood = "melancholic"
  else if (avgValence < 0.5 && avgEnergy > 0.6) dominantMood = "intense"
  else if (avgValence > 0.5 && avgEnergy < 0.4) dominantMood = "peaceful"

  // Berechne Stimmungsvariabilität
  const valenceVariance =
      valenceValues.reduce((sum, val) => sum + Math.pow(val - avgValence, 2), 0) / valenceValues.length
  const moodVariability = Math.sqrt(valenceVariance)

  // Berechne Energie-Konsistenz
  const energyVariance = energyValues.reduce((sum, val) => sum + Math.pow(val - avgEnergy, 2), 0) / energyValues.length
  const energyConsistency = 1 - Math.sqrt(energyVariance) // Invertiert: hohe Varianz = niedrige Konsistenz

  console.log(
      `😊 Stimmungsprofil: ${dominantMood} (Valenz: ${(avgValence * 100).toFixed(0)}%, Energie: ${(avgEnergy * 100).toFixed(0)}%)`,
  )

  return {
    dominantMood,
    moodVariability,
    emotionalRange: [dominantMood], // Vereinfacht
    energyConsistency,
  }
}

function analyzeDiscoveryProfile(userData: any): DiscoveryProfile {
  const shortTracks = userData.topTracksShort.items || []
  const mediumTracks = userData.topTracksMedium.items || []
  const longTracks = userData.topTracksLong.items || []

  // Berechne Offenheit für Neues
  const shortTrackIds = new Set(shortTracks.map((t: any) => t.id))
  const mediumTrackIds = new Set(mediumTracks.map((t: any) => t.id))

  const newTracksInShort = shortTracks.filter((t: any) => !mediumTrackIds.has(t.id)).length
  const newTracksRatio = shortTracks.length > 0 ? newTracksInShort / shortTracks.length : 0
  const openness = Math.min(newTracksRatio * 2, 1) // Normalisiere auf 0-1

  // Neu vs. Alt Verhältnis
  const currentYear = new Date().getFullYear()
  const trackYears = shortTracks
      .map((track: any) => {
        if (track.album?.release_date) {
          return new Date(track.album.release_date).getFullYear()
        }
        return null
      })
      .filter((year: number | null) => year !== null)

  const avgReleaseYear =
      trackYears.length > 0
          ? trackYears.reduce((sum: number, year: number) => sum + year, 0) / trackYears.length
          : currentYear - 5

  const newVsOld = Math.max(0, Math.min(1, (avgReleaseYear - (currentYear - 10)) / 10))

  // Explorations-Rate basierend auf Genre-Vielfalt
  const allGenres = new Set()
  ;[...shortTracks, ...mediumTracks].forEach((track: any) => {
    track.artists?.forEach((artist: any) => {
      artist.genres?.forEach((genre: string) => allGenres.add(genre))
    })
  })

  const explorationRate = Math.min(allGenres.size / 30, 1) // Normalisiert

  console.log(
      `🔍 Entdeckungsprofil: ${(openness * 100).toFixed(0)}% Offenheit, ${(newVsOld * 100).toFixed(0)}% neue Musik`,
  )

  return {
    openness,
    preferredDiscoveryMethod: openness > 0.6 ? "algorithmic" : "social",
    newVsOld,
    explorationRate,
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

ECHTE NUTZER-MUSIKPERSÖNLICHKEIT (basierend auf ${personality.rawDataSummary.topTracksCount} analysierten Tracks):
- Lieblings-Genres: ${topGenres}
- Persönlichkeitstyp: ${insights.musicPersonalityType}
- Dominante Stimmung: ${moodProfile.dominantMood}
- Energie-Präferenz: ${(audioProfile.energy * 100).toFixed(0)}% (analysiert aus ${personality.rawDataSummary.audioFeaturesCount} Songs)
- Positivitäts-Level: ${(audioProfile.valence * 100).toFixed(0)}%
- Tanzbarkeit: ${(audioProfile.danceability * 100).toFixed(0)}%
- Bevorzugtes Tempo: ~${audioProfile.tempo.toFixed(0)} BPM
- Mainstream vs. Nische: ${(personality.artistDiversity.mainstreamFactor * 100).toFixed(0)}% mainstream
- Datenqualität: ${personality.rawDataSummary.dataQuality}

AUFGABE:
Erstelle eine Playlist von 20 Songs, die SOWOHL zu den Keywords "${keywords.join(", ")}" ALS AUCH zur echten Musikpersönlichkeit passt.

PERSONALISIERUNGS-REGELN:
1. GENRE-MIX: 70% aus bevorzugten Genres (${topGenres}), 30% passende andere Genres
2. ENERGIE-MATCHING: Orientiere dich am echten Energie-Level von ${(audioProfile.energy * 100).toFixed(0)}%
3. STIMMUNGS-ALIGNMENT: Berücksichtige die dominante Stimmung "${moodProfile.dominantMood}"
4. TEMPO-ANPASSUNG: Bevorzuge Songs um ${audioProfile.tempo.toFixed(0)} BPM (±20 BPM)
5. MAINSTREAM-BALANCE: ${personality.artistDiversity.mainstreamFactor > 0.6 ? "Fokussiere auf populäre, bekannte Songs" : "Mische bekannte und weniger bekannte Songs"}

KEYWORD-INTERPRETATION für "${keywords.join(", ")}":
- Analysiere die emotionale Bedeutung der Keywords
- Bestimme die gewünschte Aktivität/Situation
- Wähle Songs die thematisch UND zur echten Persönlichkeit passen

SONG-AUSWAHL:
- Jeder Song muss zu den Keywords UND zur echten Persönlichkeit passen
- Verwende exakte, bekannte Song- und Künstlernamen
- Achte auf gute Übergänge zwischen den Songs
- Erstelle eine emotionale Reise durch die Playlist

FORMAT: Gib NUR das JSON-Array zurück:
[
{"title": "Exakter Song Titel", "artist": "Exakter Künstler Name"},
{"title": "Exakter Song Titel", "artist": "Exakter Künstler Name"}
]

WICHTIG: Keine Erklärungen, nur das JSON-Array!
`
}
