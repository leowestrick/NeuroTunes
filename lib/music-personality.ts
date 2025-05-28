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
}

export interface ListeningPattern {
  averageSessionLength: number
  skipRate: number
  repeatListening: number
  diversityScore: number
}

export interface ArtistDiversityProfile {
  mainGenres: string[]
  nicheFactor: number
  mainstreamFactor: number
  internationalFactor: number
}

export interface TemporalPreference {
  morningMood: string
  afternoonMood: string
  eveningMood: string
  weekendVsWeekday: string
}

export interface MoodProfile {
  dominantMood: string
  moodVariability: number
  emotionalRange: string[]
}

export interface DiscoveryProfile {
  openness: number
  preferredDiscoveryMethod: string
  newVsOld: number
}

export interface PersonalityInsights {
  musicPersonalityType: string
  listeningBehavior: string
  moodDescription: string
  discoveryStyle: string
  socialAspect: string
  recommendations: string[]
}

export async function analyzeMusicPersonality(accessToken: string): Promise<MusicPersonality> {
  try {
    console.log("Sammle Spotify-Daten für Persönlichkeitsanalyse...")

    // Sammle alle relevanten Daten parallel mit Fehlerbehandlung
    const dataPromises = [
      getTopArtists(accessToken, "short_term", 50).catch((e) => {
        console.warn("Short term artists failed:", e)
        return { items: [] }
      }),
      getTopArtists(accessToken, "medium_term", 50).catch((e) => {
        console.warn("Medium term artists failed:", e)
        return { items: [] }
      }),
      getTopArtists(accessToken, "long_term", 50).catch((e) => {
        console.warn("Long term artists failed:", e)
        return { items: [] }
      }),
      getTopTracks(accessToken, "short_term", 50).catch((e) => {
        console.warn("Short term tracks failed:", e)
        return { items: [] }
      }),
      getTopTracks(accessToken, "medium_term", 50).catch((e) => {
        console.warn("Medium term tracks failed:", e)
        return { items: [] }
      }),
      getTopTracks(accessToken, "long_term", 50).catch((e) => {
        console.warn("Long term tracks failed:", e)
        return { items: [] }
      }),
      getRecentlyPlayed(accessToken, 50).catch((e) => {
        console.warn("Recently played failed:", e)
        return { items: [] }
      }),
      getSavedTracks(accessToken, 50).catch((e) => {
        console.warn("Saved tracks failed:", e)
        return { items: [] }
      }),
      getFollowedArtists(accessToken, 50).catch((e) => {
        console.warn("Followed artists failed:", e)
        return { artists: { items: [] } }
      }),
    ]

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
    ] = await Promise.all(dataPromises)

    console.log("Analysiere Audio-Features...")

    // Sammle Track-IDs für Audio-Feature-Analyse mit besserer Validierung
    const allTrackIds = [
      ...(topTracksShort.items || []).map((t: any) => t?.id).filter(Boolean),
      ...(topTracksMedium.items || []).map((t: any) => t?.id).filter(Boolean),
      ...(recentlyPlayed.items || []).map((item: any) => item?.track?.id).filter(Boolean),
      ...(savedTracks.items || []).map((item: any) => item?.track?.id).filter(Boolean),
    ]
      .filter((id) => id && typeof id === "string")
      .slice(0, 100) // Limitiere auf 100 Tracks

    console.log(`Versuche Audio-Features für ${allTrackIds.length} Tracks zu laden...`)

    // Audio-Features mit Fallback
    let audioFeatures = { audio_features: [] }
    if (allTrackIds.length > 0) {
      audioFeatures = await getAudioFeatures(accessToken, allTrackIds)
    }

    console.log(`Audio-Features erhalten: ${audioFeatures.audio_features?.length || 0} Features`)

    console.log("Führe Basis-Analysen durch...")

    // Analysiere verschiedene Aspekte mit Fallbacks
    const genres = analyzeGenrePreferences([topArtistsShort, topArtistsMedium, topArtistsLong])
    const audioProfile = analyzeAudioFeatures(audioFeatures.audio_features || [])
    const listeningPatterns = analyzeListeningPatterns(recentlyPlayed, topTracksShort, topTracksMedium)
    const artistDiversity = analyzeArtistDiversity([topArtistsShort, topArtistsMedium, topArtistsLong], followedArtists)
    const temporalPrefs = analyzeTemporalPreferences(recentlyPlayed)
    const moodProfile = analyzeMoodProfile(audioFeatures.audio_features || [], genres)
    const discoveryProfile = analyzeDiscoveryProfile(topTracksShort, topTracksMedium, topTracksLong, followedArtists)

    console.log("Führe KI-basierte Persönlichkeitsanalyse durch...")

    // KI-basierte Persönlichkeitsanalyse
    const personalityInsights = await generatePersonalityInsights({
      genres,
      audioProfile,
      listeningPatterns,
      artistDiversity,
      temporalPrefs,
      moodProfile,
      discoveryProfile,
      rawData: {
        topArtistsShort: (topArtistsShort.items || []).slice(0, 10),
        topTracksShort: (topTracksShort.items || []).slice(0, 10),
        recentlyPlayedCount: (recentlyPlayed.items || []).length,
        savedTracksCount: (savedTracks.items || []).length,
        followedArtistsCount: followedArtists.artists?.items?.length || 0,
      },
    })

    return {
      genres,
      audioFeatures: audioProfile,
      listeningPatterns,
      artistDiversity,
      temporalPreferences: temporalPrefs,
      moodProfile,
      discoveryProfile,
      personalityInsights,
    }
  } catch (error) {
    console.error("Fehler bei der Musik-Persönlichkeitsanalyse:", error)
    throw error
  }
}

async function generatePersonalityInsights(analysisData: any): Promise<PersonalityInsights> {
  try {
    const prompt = `
Du bist ein Experte für Musikpsychologie und Persönlichkeitsanalyse. Analysiere die folgenden Spotify-Hördaten und erstelle ein detailliertes Musikpersönlichkeitsprofil.

**ANALYSEDATEN:**

**Top-Genres:** ${analysisData.genres
      .slice(0, 10)
      .map((g: any) => `${g.genre} (${g.weight.toFixed(1)})`)
      .join(", ")}

**Audio-Profil:**
- Energie: ${(analysisData.audioProfile.energy * 100).toFixed(0)}% (0-100%)
- Positivität/Valenz: ${(analysisData.audioProfile.valence * 100).toFixed(0)}% (0-100%)
- Tanzbarkeit: ${(analysisData.audioProfile.danceability * 100).toFixed(0)}% (0-100%)
- Akustik: ${(analysisData.audioProfile.acousticness * 100).toFixed(0)}% (0-100%)
- Instrumentalität: ${(analysisData.audioProfile.instrumentalness * 100).toFixed(0)}% (0-100%)
- Durchschnittstempo: ${analysisData.audioProfile.tempo.toFixed(0)} BPM
- Lautstärke: ${analysisData.audioProfile.loudness.toFixed(1)} dB
- Sprachanteil: ${(analysisData.audioProfile.speechiness * 100).toFixed(0)}% (0-100%)

**Hörgewohnheiten:**
- Wiederholungsrate: ${(analysisData.listeningPatterns.repeatListening * 100).toFixed(0)}%
- Diversitätsscore: ${(analysisData.listeningPatterns.diversityScore * 100).toFixed(0)}%

**Künstler-Diversität:**
- Mainstream-Faktor: ${(analysisData.artistDiversity.mainstreamFactor * 100).toFixed(0)}%
- Nischen-Faktor: ${(analysisData.artistDiversity.nicheFactor * 100).toFixed(0)}%
- Internationale Vielfalt: ${(analysisData.artistDiversity.internationalFactor * 100).toFixed(0)}%

**Stimmungsprofil:**
- Dominante Stimmung: ${analysisData.moodProfile.dominantMood}
- Stimmungsvariabilität: ${(analysisData.moodProfile.moodVariability * 100).toFixed(0)}%

**Entdeckungsprofil:**
- Offenheit für Neues: ${(analysisData.discoveryProfile.openness * 100).toFixed(0)}%
- Neue vs. Alte Musik: ${(analysisData.discoveryProfile.newVsOld * 100).toFixed(0)}% neue Musik

**Rohdaten:**
- Top-Künstler (aktuell): ${analysisData.rawData.topArtistsShort
      .map((a: any) => a.name)
      .slice(0, 5)
      .join(", ")}
- Top-Songs (aktuell): ${analysisData.rawData.topTracksShort
      .map((t: any) => `${t.name} - ${t.artists[0].name}`)
      .slice(0, 3)
      .join(", ")}
- Kürzlich gespielt: ${analysisData.rawData.recentlyPlayedCount} Songs
- Gespeicherte Songs: ${analysisData.rawData.savedTracksCount}
- Gefolgte Künstler: ${analysisData.rawData.followedArtistsCount}

**AUFGABE:**
Erstelle basierend auf diesen Daten eine umfassende Musikpersönlichkeitsanalyse. Analysiere die Muster und erstelle Insights über:

1. **Musikpersönlichkeitstyp** (z.B. "Energetischer Entdecker", "Melancholischer Träumer", "Vielseitiger Mainstream-Hörer")
2. **Hörverhalten** (Wie und wann hört die Person Musik?)
3. **Stimmungsbeschreibung** (Welche emotionalen Bedürfnisse erfüllt die Musik?)
4. **Entdeckungsstil** (Wie entdeckt die Person neue Musik?)
5. **Sozialer Aspekt** (Mainstream vs. Underground, Teilen vs. privat)
6. **Empfehlungen** (3-5 konkrete Tipps für bessere Musikentdeckung)

Sei präzise, einfühlsam und erkenntnisreich. Verwende die Daten, um echte Insights zu generieren, nicht nur die Zahlen zu wiederholen.

Formatiere die Antwort als JSON:
{
  "musicPersonalityType": "Kurzer prägnanter Typ (max 3 Wörter)",
  "listeningBehavior": "Beschreibung des Hörverhaltens (2-3 Sätze)",
  "moodDescription": "Beschreibung der emotionalen Musiknutzung (2-3 Sätze)",
  "discoveryStyle": "Beschreibung des Entdeckungsstils (2-3 Sätze)",
  "socialAspect": "Beschreibung des sozialen Musikverhaltens (2-3 Sätze)",
  "recommendations": ["Empfehlung 1", "Empfehlung 2", "Empfehlung 3", "Empfehlung 4", "Empfehlung 5"]
}

Gib NUR das JSON zurück, ohne zusätzlichen Text.
`

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt,
      temperature: 0.7,
      maxTokens: 800,
    })

    console.log("KI-Persönlichkeitsanalyse erhalten")

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

      // Fallback-Persönlichkeitsanalyse
      return generateFallbackPersonalityInsights(analysisData)
    }
  } catch (error) {
    console.error("Fehler bei der KI-Persönlichkeitsanalyse:", error)
    return generateFallbackPersonalityInsights(analysisData)
  }
}

function generateFallbackPersonalityInsights(analysisData: any): PersonalityInsights {
  const energy = analysisData.audioProfile.energy
  const valence = analysisData.audioProfile.valence
  const openness = analysisData.discoveryProfile.openness
  const mainstream = analysisData.artistDiversity.mainstreamFactor

  // Bestimme Persönlichkeitstyp basierend auf Daten
  let personalityType = "Ausgewogener Hörer"
  if (energy > 0.7 && openness > 0.6) personalityType = "Energetischer Entdecker"
  else if (valence < 0.4 && energy < 0.5) personalityType = "Melancholischer Träumer"
  else if (mainstream > 0.7) personalityType = "Mainstream Enthusiast"
  else if (openness > 0.8) personalityType = "Musik Explorer"

  return {
    musicPersonalityType: personalityType,
    listeningBehavior: `Du hörst Musik mit einer durchschnittlichen Energie von ${(energy * 100).toFixed(0)}% und zeigst eine ${openness > 0.6 ? "hohe" : "moderate"} Offenheit für neue Entdeckungen. Deine Hörgewohnheiten zeigen eine ${analysisData.listeningPatterns.diversityScore > 0.5 ? "vielfältige" : "fokussierte"} Musikauswahl.`,
    moodDescription: `Deine Musik spiegelt eine ${valence > 0.6 ? "überwiegend positive" : valence < 0.4 ? "eher melancholische" : "ausgewogene"} Stimmung wider. Du nutzt Musik wahrscheinlich zur ${energy > 0.6 ? "Energiegewinnung und Motivation" : "Entspannung und Reflexion"}.`,
    discoveryStyle: `Mit einer Offenheit von ${(openness * 100).toFixed(0)}% für neue Musik entdeckst du ${openness > 0.7 ? "aktiv und regelmäßig" : openness > 0.4 ? "gelegentlich" : "selten"} neue Künstler und Songs. Du bevorzugst ${analysisData.discoveryProfile.newVsOld > 0.6 ? "aktuelle" : "zeitlose"} Musik.`,
    socialAspect: `Du bewegst dich ${mainstream > 0.6 ? "hauptsächlich im Mainstream" : mainstream < 0.4 ? "eher in Nischenbereichen" : "zwischen Mainstream und Nische"}. Deine Musikauswahl ist ${analysisData.artistDiversity.internationalFactor > 0.5 ? "international vielfältig" : "regional fokussiert"}.`,
    recommendations: [
      openness < 0.5
        ? "Probiere wöchentlich einen neuen Künstler aus deinen Lieblings-Genres"
        : "Erkunde verwandte Genres zu deinen Favoriten",
      "Nutze Spotify's 'Discover Weekly' für personalisierte Empfehlungen",
      energy > 0.6
        ? "Erstelle separate Playlists für verschiedene Aktivitäten"
        : "Experimentiere mit energiereicherer Musik für Workouts",
      "Folge Künstlern, die du magst, um über neue Releases informiert zu bleiben",
      mainstream > 0.7
        ? "Entdecke Underground-Künstler in deinen Lieblings-Genres"
        : "Teile deine Nischenfunde mit Freunden",
    ],
  }
}

function analyzeGenrePreferences(topArtistsData: any[]): GenrePreference[] {
  const genreCount: Record<string, number> = {}
  const genreRecency: Record<string, number> = {}

  topArtistsData.forEach((data, timeIndex) => {
    const weight = timeIndex === 0 ? 3 : timeIndex === 1 ? 2 : 1 // Neuere Daten höher gewichten

    data.items.forEach((artist: any, index: number) => {
      const positionWeight = 1 - index / data.items.length // Höhere Positionen höher gewichten

      artist.genres.forEach((genre: string) => {
        genreCount[genre] = (genreCount[genre] || 0) + weight * positionWeight
        genreRecency[genre] = Math.max(genreRecency[genre] || 0, weight)
      })
    })
  })

  return Object.entries(genreCount)
    .map(([genre, count]) => ({
      genre,
      weight: count,
      confidence: Math.min(genreRecency[genre] / 3, 1), // Normalisiere Konfidenz
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 20) // Top 20 Genres
}

function analyzeAudioFeatures(audioFeatures: any[]): AudioFeatureProfile {
  const validFeatures = audioFeatures.filter((f) => f !== null)

  if (validFeatures.length === 0) {
    return {
      energy: 0.5,
      valence: 0.5,
      danceability: 0.5,
      acousticness: 0.5,
      instrumentalness: 0.5,
      tempo: 120,
      loudness: -10,
      speechiness: 0.1,
    }
  }

  const avg = (key: string) => validFeatures.reduce((sum, f) => sum + (f[key] || 0), 0) / validFeatures.length

  return {
    energy: avg("energy"),
    valence: avg("valence"),
    danceability: avg("danceability"),
    acousticness: avg("acousticness"),
    instrumentalness: avg("instrumentalness"),
    tempo: avg("tempo"),
    loudness: avg("loudness"),
    speechiness: avg("speechiness"),
  }
}

function analyzeListeningPatterns(recentlyPlayed: any, topTracksShort: any, topTracksMedium: any): ListeningPattern {
  const recentTracks = recentlyPlayed.items || []
  const shortTermTracks = topTracksShort.items || []
  const mediumTermTracks = topTracksMedium.items || []

  // Berechne Wiederholungsrate
  const trackCounts: Record<string, number> = {}
  recentTracks.forEach((item: any) => {
    const trackId = item.track.id
    trackCounts[trackId] = (trackCounts[trackId] || 0) + 1
  })

  const repeatListening =
    Object.values(trackCounts).filter((count) => count > 1).length / Object.keys(trackCounts).length

  // Berechne Diversität
  const uniqueArtists = new Set(recentTracks.map((item: any) => item.track.artists[0]?.id)).size
  const totalTracks = recentTracks.length
  const diversityScore = totalTracks > 0 ? uniqueArtists / totalTracks : 0

  return {
    averageSessionLength: recentTracks.length, // Vereinfacht
    skipRate: 0.1, // Placeholder - würde echte Daten benötigen
    repeatListening,
    diversityScore,
  }
}

function analyzeArtistDiversity(topArtistsData: any[], followedArtists: any): ArtistDiversityProfile {
  const allArtists = topArtistsData.flatMap((data) => data.items)
  const allGenres = allArtists.flatMap((artist: any) => artist.genres)

  // Hauptgenres identifizieren
  const genreCount: Record<string, number> = {}
  allGenres.forEach((genre: string) => {
    genreCount[genre] = (genreCount[genre] || 0) + 1
  })

  const mainGenres = Object.entries(genreCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre)

  // Mainstream vs. Nische berechnen
  const popularityScores = allArtists.map((artist: any) => artist.popularity || 0)
  const avgPopularity = popularityScores.reduce((sum, pop) => sum + pop, 0) / popularityScores.length
  const mainstreamFactor = avgPopularity / 100

  // Nischenfaktor (inverse von Mainstream)
  const nicheFactor = 1 - mainstreamFactor

  // Internationale Vielfalt (vereinfacht)
  const internationalFactor = Math.min(new Set(allGenres).size / 50, 1)

  return {
    mainGenres,
    nicheFactor,
    mainstreamFactor,
    internationalFactor,
  }
}

function analyzeTemporalPreferences(recentlyPlayed: any): TemporalPreference {
  const items = recentlyPlayed.items || []

  // Gruppiere nach Tageszeit (vereinfacht)
  const timeGroups = {
    morning: items.filter((item: any) => {
      const hour = new Date(item.played_at).getHours()
      return hour >= 6 && hour < 12
    }),
    afternoon: items.filter((item: any) => {
      const hour = new Date(item.played_at).getHours()
      return hour >= 12 && hour < 18
    }),
    evening: items.filter((item: any) => {
      const hour = new Date(item.played_at).getHours()
      return hour >= 18 || hour < 6
    }),
  }

  return {
    morningMood: timeGroups.morning.length > 0 ? "energetic" : "calm",
    afternoonMood: timeGroups.afternoon.length > 0 ? "focused" : "relaxed",
    eveningMood: timeGroups.evening.length > 0 ? "chill" : "party",
    weekendVsWeekday: "similar", // Placeholder
  }
}

function analyzeMoodProfile(audioFeatures: any[], genres: GenrePreference[]): MoodProfile {
  const validFeatures = audioFeatures.filter((f) => f !== null)

  if (validFeatures.length === 0) {
    return {
      dominantMood: "balanced",
      moodVariability: 0.5,
      emotionalRange: ["neutral"],
    }
  }

  const avgValence = validFeatures.reduce((sum, f) => sum + (f.valence || 0.5), 0) / validFeatures.length
  const avgEnergy = validFeatures.reduce((sum, f) => sum + (f.energy || 0.5), 0) / validFeatures.length

  // Bestimme dominante Stimmung
  let dominantMood = "balanced"
  if (avgValence > 0.7 && avgEnergy > 0.7) dominantMood = "euphoric"
  else if (avgValence > 0.6 && avgEnergy > 0.6) dominantMood = "happy"
  else if (avgValence < 0.4 && avgEnergy < 0.4) dominantMood = "melancholic"
  else if (avgValence < 0.5 && avgEnergy > 0.6) dominantMood = "intense"
  else if (avgValence > 0.5 && avgEnergy < 0.4) dominantMood = "peaceful"

  // Berechne Stimmungsvariabilität
  const valenceVariance =
    validFeatures.reduce((sum, f) => sum + Math.pow((f.valence || 0.5) - avgValence, 2), 0) / validFeatures.length
  const moodVariability = Math.sqrt(valenceVariance)

  return {
    dominantMood,
    moodVariability,
    emotionalRange: [dominantMood], // Vereinfacht
  }
}

function analyzeDiscoveryProfile(
  topTracksShort: any,
  topTracksMedium: any,
  topTracksLong: any,
  followedArtists: any,
): DiscoveryProfile {
  const shortTracks = topTracksShort.items || []
  const mediumTracks = topTracksMedium.items || []
  const longTracks = topTracksLong.items || []

  // Berechne Offenheit für Neues
  const shortTrackIds = new Set(shortTracks.map((t: any) => t.id))
  const mediumTrackIds = new Set(mediumTracks.map((t: any) => t.id))

  const newTracksRatio = shortTracks.filter((t: any) => !mediumTrackIds.has(t.id)).length / shortTracks.length
  const openness = Math.min(newTracksRatio * 2, 1) // Normalisiere auf 0-1

  // Neu vs. Alt Verhältnis
  const avgReleaseYear =
    shortTracks.reduce((sum: number, track: any) => {
      const year = new Date(track.album.release_date).getFullYear()
      return sum + year
    }, 0) / shortTracks.length

  const currentYear = new Date().getFullYear()
  const newVsOld = Math.max(0, Math.min(1, (avgReleaseYear - (currentYear - 10)) / 10))

  return {
    openness,
    preferredDiscoveryMethod: openness > 0.6 ? "algorithmic" : "social",
    newVsOld,
  }
}

export function generatePersonalityPrompt(personality: MusicPersonality, keywords: string[]): string {
  const topGenres = personality.genres
    .slice(0, 5)
    .map((g) => g.genre)
    .join(", ")
  const audioProfile = personality.audioFeatures
  const moodProfile = personality.moodProfile
  const discoveryProfile = personality.discoveryProfile
  const insights = personality.personalityInsights

  return `
Du bist ein KI-Musik-Kurator, der eine personalisierte Playlist für einen Nutzer mit folgender detaillierter Musikpersönlichkeit erstellt:

**NUTZER-PERSÖNLICHKEIT:**
- **Persönlichkeitstyp:** ${insights.musicPersonalityType}
- **Bevorzugte Genres:** ${topGenres}
- **Dominante Stimmung:** ${moodProfile.dominantMood}
- **Energie-Level:** ${(audioProfile.energy * 100).toFixed(0)}% (0-100%)
- **Positivität:** ${(audioProfile.valence * 100).toFixed(0)}% (0-100%)
- **Tanzbarkeit:** ${(audioProfile.danceability * 100).toFixed(0)}% (0-100%)
- **Akustik-Präferenz:** ${(audioProfile.acousticness * 100).toFixed(0)}% (0-100%)
- **Durchschnittstempo:** ${audioProfile.tempo.toFixed(0)} BPM
- **Offenheit für Neues:** ${(discoveryProfile.openness * 100).toFixed(0)}% (0-100%)
- **Mainstream vs. Nische:** ${(personality.artistDiversity.mainstreamFactor * 100).toFixed(0)}% mainstream
- **Neue vs. Alte Musik:** ${(discoveryProfile.newVsOld * 100).toFixed(0)}% neue Musik

**PERSÖNLICHKEITS-INSIGHTS:**
- **Hörverhalten:** ${insights.listeningBehavior}
- **Stimmungsnutzung:** ${insights.moodDescription}
- **Entdeckungsstil:** ${insights.discoveryStyle}
- **Sozialer Aspekt:** ${insights.socialAspect}

**AKTUELLE ANFRAGE:**
Keywords: ${keywords.join(", ")}

**AUFGABE:**
Erstelle eine Playlist von 20 Songs, die perfekt zu den Keywords UND der detaillierten Musikpersönlichkeit des Nutzers passt.

**PERSONALISIERUNGS-STRATEGIE:**
1. **Genre-Verteilung:** 60% aus bevorzugten Genres (${topGenres}), 40% verwandte/komplementäre Genres
2. **Energie-Matching:** Berücksichtige das Energie-Level von ${(audioProfile.energy * 100).toFixed(0)}%
3. **Stimmungs-Alignment:** Passe zur dominanten Stimmung "${moodProfile.dominantMood}"
4. **Entdeckungs-Balance:** ${discoveryProfile.openness > 0.6 ? "Mische bekannte und neue Songs" : "Fokussiere auf vertraute Künstler"}
5. **Mainstream-Balance:** ${personality.artistDiversity.mainstreamFactor > 0.6 ? "Bevorzuge populäre Songs" : "Mische Mainstream und Nische"}
6. **Tempo-Anpassung:** Orientiere dich am bevorzugten Tempo von ~${audioProfile.tempo.toFixed(0)} BPM

**BERÜCKSICHTIGE BESONDERS:**
- Die Keywords: ${keywords.join(", ")}
- Den Persönlichkeitstyp: ${insights.musicPersonalityType}
- Das Hörverhalten: ${insights.listeningBehavior.split(".")[0]}
- Die Stimmungsnutzung: ${insights.moodDescription.split(".")[0]}

**PLAYLIST-FLOW:**
- Beginne mit einem starken, charakteristischen Song
- Baue eine emotionale Reise auf, die zur Persönlichkeit passt
- Achte auf Tempo- und Energie-Übergänge
- Ende mit einem memorablen, zur Stimmung passenden Song

Formatiere die Ausgabe als JSON-Array mit Objekten, die "title" und "artist" enthalten.
Beispiel: [{"title": "Song Name", "artist": "Artist Name"}, ...]

Gib NUR das JSON-Array zurück, ohne zusätzlichen Text oder Erklärungen.
`
}
