"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useSpotify } from "@/hooks/use-spotify"
import { toast } from "@/hooks/use-toast"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, Wifi, WifiOff } from "lucide-react"
import Image from "next/image"

interface SpotifyPlayerProps {
  trackUri?: string
  trackUris?: string[]
  autoPlay?: boolean
}

interface PlayerState {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: {
      id: string
      name: string
      artists: Array<{ name: string }>
      album: {
        name: string
        images: Array<{ url: string }>
      }
      uri: string
    }
  }
  repeat_mode: number
  shuffle: boolean
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void
    Spotify: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume: number
      }) => SpotifyPlayer
    }
  }
}

interface SpotifyPlayer {
  addListener: (event: string, callback: (data: any) => void) => void
  removeListener: (event: string, callback?: (data: any) => void) => void
  connect: () => Promise<boolean>
  disconnect: () => void
  getCurrentState: () => Promise<PlayerState | null>
  setName: (name: string) => Promise<void>
  getVolume: () => Promise<number>
  setVolume: (volume: number) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  togglePlay: () => Promise<void>
  seek: (position: number) => Promise<void>
  previousTrack: () => Promise<void>
  nextTrack: () => Promise<void>
}

export function SpotifyPlayer({ trackUri, trackUris, autoPlay = false }: SpotifyPlayerProps) {
  const { accessToken, user } = useSpotify()
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null)
  const [deviceId, setDeviceId] = useState<string>("")
  const [playerState, setPlayerState] = useState<PlayerState | null>(null)
  const [volume, setVolume] = useState(50)
  const [isSDKReady, setIsSDKReady] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // SDK laden
  useEffect(() => {
    if (!accessToken) return

    // Prüfe ob SDK bereits geladen ist
    if (window.Spotify) {
      setIsSDKReady(true)
      return
    }

    // Prüfe ob Script bereits existiert
    if (document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
      return
    }

    const script = document.createElement("script")
    script.src = "https://sdk.scdn.co/spotify-player.js"
    script.async = true
    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      setIsSDKReady(true)
    }

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script)
      }
    }
  }, [accessToken])

  // Player initialisieren
  useEffect(() => {
    if (!isSDKReady || !accessToken || player) return

    const spotifyPlayer = new window.Spotify.Player({
      name: `NeuroTunes Web Player - ${user?.display_name || "User"}`,
      getOAuthToken: (cb) => cb(accessToken),
      volume: volume / 100,
    })

    // Event Listeners
    spotifyPlayer.addListener("ready", ({ device_id }) => {
      console.log("Spotify Player bereit mit Device ID:", device_id)
      setDeviceId(device_id)
      setIsConnected(true)
      setConnectionError(null)

      // Aktiviere das Gerät automatisch
      activateDevice(device_id)

      toast({
        title: "NeuroTunes Player bereit",
        description: "Du kannst jetzt Songs direkt abspielen!",
      })
    })

    spotifyPlayer.addListener("not_ready", ({ device_id }) => {
      console.log("Device ID ist offline:", device_id)
      setIsConnected(false)
      setConnectionError("Gerät ist offline")
    })

    spotifyPlayer.addListener("player_state_changed", (state) => {
      if (state) {
        setPlayerState(state)
        checkIfLiked(state.track_window.current_track.id)
      }
    })

    spotifyPlayer.addListener("initialization_error", ({ message }) => {
      console.error("Initialisierungsfehler:", message)
      setConnectionError("Initialisierungsfehler")
      toast({
        title: "Player-Fehler",
        description: "Spotify Player konnte nicht initialisiert werden.",
        variant: "destructive",
      })
    })

    spotifyPlayer.addListener("authentication_error", ({ message }) => {
      console.error("Authentifizierungsfehler:", message)
      setConnectionError("Authentifizierungsfehler")
      toast({
        title: "Authentifizierungsfehler",
        description: "Spotify-Token ist ungültig. Bitte melde dich erneut an.",
        variant: "destructive",
      })
    })

    spotifyPlayer.addListener("account_error", ({ message }) => {
      console.error("Account-Fehler:", message)
      setConnectionError("Premium erforderlich")
      toast({
        title: "Spotify Premium erforderlich",
        description: "Für die Web-Wiedergabe ist Spotify Premium nötig.",
        variant: "destructive",
      })
    })

    spotifyPlayer.connect().then((success) => {
      if (success) {
        console.log("Erfolgreich mit Spotify Web Playback SDK verbunden")
      } else {
        console.error("Verbindung zum Spotify Web Playback SDK fehlgeschlagen")
        setConnectionError("Verbindung fehlgeschlagen")
      }
    })

    setPlayer(spotifyPlayer)

    return () => {
      spotifyPlayer.disconnect()
    }
  }, [isSDKReady, accessToken, user, volume])

  // Gerät aktivieren
  const activateDevice = async (deviceId: string) => {
    try {
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      })
      console.log("Gerät aktiviert:", deviceId)
    } catch (error) {
      console.error("Fehler beim Aktivieren des Geräts:", error)
    }
  }

  // Track abspielen
  const playTrack = useCallback(
    async (uri: string, uris?: string[]) => {
      if (!deviceId || !accessToken) {
        toast({
          title: "Player nicht bereit",
          description: "Warte bis der Player verbunden ist.",
          variant: "destructive",
        })
        return
      }

      try {
        const body = uris ? { uris, offset: { uri } } : { uris: [uri] }

        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        toast({
          title: "Wiedergabe gestartet",
          description: "Track wird abgespielt",
        })
      } catch (error) {
        console.error("Fehler beim Abspielen:", error)
        toast({
          title: "Wiedergabe-Fehler",
          description: "Track konnte nicht abgespielt werden.",
          variant: "destructive",
        })
      }
    },
    [deviceId, accessToken],
  )

  // Auto-Play
  useEffect(() => {
    if (autoPlay && trackUri && isConnected && deviceId) {
      playTrack(trackUri, trackUris)
    }
  }, [autoPlay, trackUri, trackUris, isConnected, deviceId, playTrack])

  // Like-Status prüfen
  const checkIfLiked = async (trackId: string) => {
    if (!accessToken || !trackId) return

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const [liked] = await response.json()
      setIsLiked(liked)
    } catch (error) {
      console.error("Fehler beim Prüfen des Like-Status:", error)
    }
  }

  // Like/Unlike Track
  const toggleLike = async () => {
    if (!accessToken || !playerState?.track_window.current_track.id) return

    try {
      const method = isLiked ? "DELETE" : "PUT"
      await fetch(`https://api.spotify.com/v1/me/tracks?ids=${playerState.track_window.current_track.id}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      setIsLiked(!isLiked)
    } catch (error) {
      console.error("Fehler beim Like/Unlike:", error)
    }
  }

  // Lautstärke ändern
  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0]
    setVolume(vol)
    if (player) {
      player.setVolume(vol / 100)
    }
  }

  // Position formatieren
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Position ändern
  const handleSeek = (position: number[]) => {
    if (player && playerState) {
      const newPosition = (position[0] / 100) * playerState.duration
      player.seek(newPosition)
    }
  }

  if (!accessToken) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground">Melde dich mit Spotify an, um Songs abzuspielen.</p>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected || !playerState) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2">
            {connectionError ? (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                <span className="text-muted-foreground">{connectionError}</span>
              </>
            ) : (
              <>
                <Wifi className="h-5 w-5 text-emerald-500 animate-pulse" />
                <span className="text-muted-foreground">
                  {isSDKReady ? "Verbinde mit Spotify..." : "Lade Spotify Player..."}
                </span>
              </>
            )}
          </div>
          {connectionError === "Premium erforderlich" && (
            <div className="mt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://www.spotify.com/premium/", "_blank")}
              >
                Spotify Premium holen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const currentTrack = playerState.track_window.current_track
  const progress = playerState.duration > 0 ? (playerState.position / playerState.duration) * 100 : 0

  return (
    <Card className="w-full bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-1">
            <Wifi className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-emerald-600">Live</span>
          </div>

          {/* Album Cover */}
          <div className="relative h-16 w-16 overflow-hidden rounded-md flex-shrink-0">
            <Image
              src={currentTrack.album.images[0]?.url || "/placeholder.svg?height=64&width=64"}
              alt={currentTrack.album.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{currentTrack.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {currentTrack.artists.map((artist) => artist.name).join(", ")}
            </p>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">{formatTime(playerState.position)}</span>
              <Slider value={[progress]} onValueChange={handleSeek} max={100} step={1} className="flex-1" />
              <span className="text-xs text-muted-foreground">{formatTime(playerState.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Like Button */}
            <Button variant="ghost" size="icon" onClick={toggleLike} className="h-8 w-8">
              <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            </Button>

            {/* Previous */}
            <Button variant="ghost" size="icon" onClick={() => player?.previousTrack()} className="h-8 w-8">
              <SkipBack className="h-4 w-4" />
            </Button>

            {/* Play/Pause */}
            <Button
              variant="default"
              size="icon"
              onClick={() => player?.togglePlay()}
              className="h-10 w-10 bg-emerald-600 hover:bg-emerald-700"
            >
              {playerState.paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </Button>

            {/* Next */}
            <Button variant="ghost" size="icon" onClick={() => player?.nextTrack()} className="h-8 w-8">
              <SkipForward className="h-4 w-4" />
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleVolumeChange(volume > 0 ? [0] : [50])}
                className="h-8 w-8"
              >
                {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider value={[volume]} onValueChange={handleVolumeChange} max={100} step={1} className="w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
