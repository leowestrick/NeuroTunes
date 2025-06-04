import { getAccessToken, getUserId } from "./auth"

export async function getPlaylistById(playlistId: string) {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    throw new Error("Nicht authentifiziert")
  }

  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error("Playlist nicht gefunden")
  }

  return response.json()
}

export async function createPlaylist(accessToken: string, name: string, description: string) {
  const userId = await getUserId()

  if (!userId) {
    throw new Error("Benutzer-ID konnte nicht abgerufen werden")
  }

  const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      public: false,
    }),
  })

  if (!response.ok) {
    throw new Error("Playlist konnte nicht erstellt werden")
  }

  return response.json()
}

export async function addTracksToPlaylist(accessToken: string, playlistId: string, uris: string[]) {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uris,
    }),
  })

  if (!response.ok) {
    throw new Error("Tracks konnten nicht zur Playlist hinzugefügt werden")
  }

  return response.json()
}

export async function searchTracks(accessToken: string, query: string, limit = 20) {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error("Suche fehlgeschlagen")
  }

  const data = await response.json()
  return data.tracks.items
}

export async function getUserPlaylists(accessToken: string) {
  const response = await fetch("https://api.spotify.com/v1/me/playlists", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error("Playlists konnten nicht abgerufen werden")
  }

  return response.json()
}

// Neue Funktionen für Hörgewohnheiten

export async function getTopArtists(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit = 50,
) {
  const response = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error("Top-Künstler konnten nicht abgerufen werden")
  }

  return response.json()
}

export async function getTopTracks(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit = 50,
) {
  const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error("Top-Tracks konnten nicht abgerufen werden")
  }

  return response.json()
}

export async function getRecentlyPlayed(accessToken: string, limit = 50) {
  const response = await fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error("Kürzlich gespielte Tracks konnten nicht abgerufen werden")
  }

  return response.json()
}

export async function getAudioFeatures(accessToken: string, trackIds: string[]) {
  if (!trackIds || trackIds.length === 0) {
    console.warn("Keine Track-IDs für Audio-Features bereitgestellt")
    return { audio_features: [] }
  }

  // Filtere ungültige IDs und limitiere auf 100 (Spotify API Limit)
  const validTrackIds = trackIds.filter((id) => id && typeof id === "string").slice(0, 100)

  if (validTrackIds.length === 0) {
    console.warn("Keine gültigen Track-IDs für Audio-Features")
    return { audio_features: [] }
  }

  const ids = validTrackIds.join(",")

  try {
    // Versuche zuerst, die Audio-Features für alle Tracks auf einmal zu holen
    const response = await fetch(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Audio-Features API Fehler (${response.status}):`, errorText)

      // Bei 403 oder 429 Fehlern: Versuche einzelne Tracks
      if (response.status === 403 || response.status === 429) {
        console.log("Versuche Audio-Features für einzelne Tracks zu laden...")
        return await getAudioFeaturesIndividually(accessToken, validTrackIds)
      }

      // Fallback: Leere Audio-Features zurückgeben
      return { audio_features: [] }
    }

    const data = await response.json()
    console.log(`Audio-Features für ${validTrackIds.length} Tracks abgerufen`)

    return data
  } catch (error) {
    console.error("Netzwerkfehler beim Abrufen der Audio-Features:", error)
    // Fallback: Leere Audio-Features zurückgeben
    return { audio_features: [] }
  }
}

// Hilfsfunktion, um Audio-Features für einzelne Tracks zu laden
async function getAudioFeaturesIndividually(accessToken: string, trackIds: string[]) {
  console.log(`Versuche Audio-Features für ${trackIds.length} einzelne Tracks zu laden...`)

  const audioFeatures = []
  const batchSize = 5 // Kleinere Batches, um Rate Limiting zu vermeiden

  // Verarbeite Tracks in kleinen Batches
  for (let i = 0; i < trackIds.length; i += batchSize) {
    const batch = trackIds.slice(i, i + batchSize)

    // Warte kurz zwischen den Batches, um Rate Limiting zu vermeiden
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    const batchPromises = batch.map(async (trackId) => {
      try {
        const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (response.ok) {
          return await response.json()
        }
        return null
      } catch (error) {
        console.warn(`Fehler beim Laden der Audio-Features für Track ${trackId}:`, error)
        return null
      }
    })

    const batchResults = await Promise.all(batchPromises)
    audioFeatures.push(...batchResults.filter(Boolean))
  }

  console.log(`${audioFeatures.length} von ${trackIds.length} Audio-Features einzeln geladen`)
  return { audio_features: audioFeatures }
}

export async function getSavedTracks(accessToken: string, limit = 50) {
  const response = await fetch(`https://api.spotify.com/v1/me/tracks?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error("Gespeicherte Tracks konnten nicht abgerufen werden")
  }

  return response.json()
}

export async function getFollowedArtists(accessToken: string, limit = 50) {
  const response = await fetch(`https://api.spotify.com/v1/me/following?type=artist&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error("Gefolgte Künstler konnten nicht abgerufen werden")
  }

  return response.json()
}

// Neue Funktion zum Testen der API-Berechtigungen
export async function testApiPermissions(accessToken: string) {
  const endpoints = [
    { name: "User Profile", url: "https://api.spotify.com/v1/me" },
    { name: "Top Artists", url: "https://api.spotify.com/v1/me/top/artists?limit=1" },
    { name: "Top Tracks", url: "https://api.spotify.com/v1/me/top/tracks?limit=1" },
    { name: "Recently Played", url: "https://api.spotify.com/v1/me/player/recently-played?limit=1" },
    { name: "Saved Tracks", url: "https://api.spotify.com/v1/me/tracks?limit=1" },
    { name: "Followed Artists", url: "https://api.spotify.com/v1/me/following?type=artist&limit=1" },
    { name: "Audio Features", url: "https://api.spotify.com/v1/audio-features/06AKEBrKUckW0KREUWRnvT" }, // Shape of You (Ed Sheeran) als Test-Track
  ]

  const results = {}

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      results[endpoint.name] = {
        status: response.status,
        ok: response.ok,
      }

      if (!response.ok) {
        const errorText = await response.text()
        results[endpoint.name].error = errorText
      }
    } catch (error) {
      results[endpoint.name] = {
        status: "error",
        error: error.message,
      }
    }
  }

  return results
}
