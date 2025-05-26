import {
  getTopArtists,
  getTopTracks,
  getRecentlyPlayed,
  getAudioFeatures,
  getSavedTracks,
  getFollowedArtists,
} from "./spotify"

export interface MusicPersonality {
  genres: GenrePreference[]
  audioFeatures: AudioFeatureProfile
  listeningPatterns: ListeningPattern
  artistDiversity: ArtistDiversityProfile
  temporalPreferences: TemporalPreference
  moodProfile: MoodProfile
  discoveryProfile: DiscoveryProfile
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

export async function analyzeMusicPersonality(accessToken: string): Promise<MusicPersonality> {
  try {
    // Sammle alle relevanten Daten parallel
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
    ] = await Promise.all([
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

    // Sammle Track-IDs für Audio-Feature-Analyse
    const allTrackIds = [
      ...topTracksShort.items.map((t: any) => t.id),
      ...topTracksMedium.items.map((t: any) => t.id),
      ...recentlyPlayed.items.map((item: any) => item.track.id),
      ...savedTracks.items.map((item: any) => item.track.id),
    ]
      .filter(Boolean)
      .slice(0, 100) // Limitiere auf 100 Tracks

    const audioFeatures = await getAudioFeatures(accessToken, allTrackIds)

    // Analysiere verschiedene Aspekte
    const genres = analyzeGenrePreferences([topArtistsShort, topArtistsMedium, topArtistsLong])
    const audioProfile = analyzeAudioFeatures(audioFeatures.audio_features)
    const listeningPatterns = analyzeListeningPatterns(recentlyPlayed, topTracksShort, topTracksMedium)
    const artistDiversity = analyzeArtistDiversity([topArtistsShort, topArtistsMedium, topArtistsLong], followedArtists)
    const temporalPrefs = analyzeTemporalPreferences(recentlyPlayed)
    const moodProfile = analyzeMoodProfile(audioFeatures.audio_features, genres)
    const discoveryProfile = analyzeDiscoveryProfile(topTracksShort, topTracksMedium, topTracksLong, followedArtists)

    return {
      genres,
      audioFeatures: audioProfile,
      listeningPatterns,
      artistDiversity,
      temporalPreferences: temporalPrefs,
      moodProfile,
      discoveryProfile,
    }
  } catch (error) {
    console.error("Fehler bei der Musik-Persönlichkeitsanalyse:", error)
    throw error
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

  return `
Du bist ein KI-Musik-Kurator, der eine personalisierte Playlist für einen Nutzer mit folgenden Musikpräferenzen erstellt:

**NUTZER-PERSÖNLICHKEIT:**
- Bevorzugte Genres: ${topGenres}
- Dominante Stimmung: ${moodProfile.dominantMood}
- Energie-Level: ${(audioProfile.energy * 100).toFixed(0)}% (0-100%)
- Positivität: ${(audioProfile.valence * 100).toFixed(0)}% (0-100%)
- Tanzbarkeit: ${(audioProfile.danceability * 100).toFixed(0)}% (0-100%)
- Akustik-Präferenz: ${(audioProfile.acousticness * 100).toFixed(0)}% (0-100%)
- Durchschnittstempo: ${audioProfile.tempo.toFixed(0)} BPM
- Offenheit für Neues: ${(discoveryProfile.openness * 100).toFixed(0)}% (0-100%)
- Mainstream vs. Nische: ${(personality.artistDiversity.mainstreamFactor * 100).toFixed(0)}% mainstream
- Neue vs. Alte Musik: ${(discoveryProfile.newVsOld * 100).toFixed(0)}% neue Musik

**AKTUELLE ANFRAGE:**
Keywords: ${keywords.join(", ")}

**AUFGABE:**
Erstelle eine Playlist von 20 Songs, die perfekt zu den Keywords UND der Musikpersönlichkeit des Nutzers passt.

**BERÜCKSICHTIGE:**
1. Die bevorzugten Genres des Nutzers (${topGenres})
2. Das gewünschte Energie-Level (${(audioProfile.energy * 100).toFixed(0)}%)
3. Die Stimmungspräferenz (${moodProfile.dominantMood})
4. Die Offenheit für neue Entdeckungen (${(discoveryProfile.openness * 100).toFixed(0)}%)
5. Das Mainstream/Nische-Verhältnis
6. Die Keywords: ${keywords.join(", ")}

**STRATEGIE:**
- 60% der Songs sollten aus den bevorzugten Genres stammen
- 40% können verwandte oder komplementäre Genres sein
- Berücksichtige das Energie-Level und die Stimmung
- Mische bekannte und weniger bekannte Songs basierend auf der Offenheit
- Achte auf eine gute Flow und Progression der Playlist

Formatiere die Ausgabe als JSON-Array mit Objekten, die "title" und "artist" enthalten.
Beispiel: [{"title": "Song Name", "artist": "Artist Name"}, ...]

Gib NUR das JSON-Array zurück, ohne zusätzlichen Text oder Erklärungen.
`
}
