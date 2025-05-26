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
  const ids = trackIds.join(",")
  const response = await fetch(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error("Audio-Features konnten nicht abgerufen werden")
  }

  return response.json()
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
