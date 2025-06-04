"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, AlertCircle } from "lucide-react"
import { useSpotify } from "@/hooks/use-spotify"
import { toast } from "@/hooks/use-toast"

interface TrackPlayerProps {
  track: {
    id: string
    uri: string
    name: string
    artists: Array<{ name: string }>
    preview_url?: string
  }
  playlistUris?: string[]
  isCurrentlyPlaying?: boolean
  onPlay?: (trackUri: string) => void
}

export function TrackPlayer({ track, playlistUris, isCurrentlyPlaying, onPlay }: TrackPlayerProps) {
  const { accessToken } = useSpotify()
  const [isPlaying, setIsPlaying] = useState(false)
  const [availableDevices, setAvailableDevices] = useState<any[]>([])
  const [activeDevice, setActiveDevice] = useState<string | null>(null)

  // Verfügbare Geräte abrufen
  useEffect(() => {
    if (accessToken) {
      checkAvailableDevices()
    }
  }, [accessToken])

  const checkAvailableDevices = async () => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableDevices(data.devices)

        // Finde aktives Gerät oder das erste verfügbare
        const active = data.devices.find((device: any) => device.is_active)
        if (active) {
          setActiveDevice(active.id)
        } else if (data.devices.length > 0) {
          // Aktiviere das erste verfügbare Gerät
          await activateDevice(data.devices[0].id)
        }
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Geräte:", error)
    }
  }

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
      setActiveDevice(deviceId)
    } catch (error) {
      console.error("Fehler beim Aktivieren des Geräts:", error)
    }
  }

  const handlePlay = async () => {
    if (!accessToken) {
      toast({
        title: "Nicht angemeldet",
        description: "Bitte melde dich mit Spotify an.",
        variant: "destructive",
      })
      return
    }

    // Prüfe zuerst verfügbare Geräte
    await checkAvailableDevices()

    try {
      // Versuche über Spotify Web API zu spielen
      const playEndpoint = activeDevice
        ? `https://api.spotify.com/v1/me/player/play?device_id=${activeDevice}`
        : "https://api.spotify.com/v1/me/player/play"

      const response = await fetch(playEndpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          uris: playlistUris || [track.uri],
          offset: playlistUris ? { uri: track.uri } : undefined,
        }),
      })

      if (response.ok) {
        setIsPlaying(true)
        onPlay?.(track.uri)
        toast({
          title: "Wiedergabe gestartet",
          description: `"${track.name}" wird abgespielt`,
        })
      } else if (response.status === 404) {
        // Kein aktives Gerät gefunden
        handleNoActiveDevice()
      } else if (response.status === 403) {
        // Premium erforderlich
        handlePremiumRequired()
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Fehler beim Abspielen:", error)
      handlePlaybackError()
    }
  }

  const handleNoActiveDevice = () => {
    toast({
      title: "Kein Spotify-Gerät aktiv",
      description: "Öffne Spotify auf einem Gerät oder verwende den Web Player.",
      variant: "destructive",
      action: (
        <Button variant="outline" size="sm" onClick={() => window.open("https://open.spotify.com", "_blank")}>
          Spotify öffnen
        </Button>
      ),
    })

    // Fallback auf Preview
    playPreview()
  }

  const handlePremiumRequired = () => {
    toast({
      title: "Spotify Premium erforderlich",
      description: "Für die vollständige Wiedergabe ist Spotify Premium nötig. Spiele 30s Preview ab.",
      variant: "destructive",
    })

    // Fallback auf Preview
    playPreview()
  }

  const handlePlaybackError = () => {
    toast({
      title: "Wiedergabe-Fehler",
      description: "Song konnte nicht abgespielt werden. Versuche Preview.",
      variant: "destructive",
    })

    // Fallback auf Preview
    playPreview()
  }

  const playPreview = () => {
    if (track.preview_url) {
      try {
        const audio = new Audio(track.preview_url)
        audio.play()
        setIsPlaying(true)

        toast({
          title: "Preview wird abgespielt",
          description: `30-Sekunden-Vorschau von "${track.name}"`,
        })

        audio.addEventListener("ended", () => {
          setIsPlaying(false)
        })

        audio.addEventListener("error", () => {
          setIsPlaying(false)
          toast({
            title: "Preview nicht verfügbar",
            description: "Für diesen Song ist keine Vorschau verfügbar.",
            variant: "destructive",
          })
        })

        onPlay?.(track.uri)
      } catch (error) {
        console.error("Fehler beim Abspielen der Preview:", error)
        toast({
          title: "Preview-Fehler",
          description: "Vorschau konnte nicht abgespielt werden.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Keine Vorschau verfügbar",
        description: "Für diesen Song ist keine Vorschau verfügbar.",
        variant: "destructive",
      })
    }
  }

  const getButtonVariant = () => {
    if (availableDevices.length === 0) {
      return "outline" // Zeigt an, dass nur Preview verfügbar ist
    }
    return "ghost"
  }

  const getButtonIcon = () => {
    if (availableDevices.length === 0) {
      return <AlertCircle className="h-4 w-4 text-amber-500" />
    }
    return isCurrentlyPlaying || isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />
  }

  return (
    <Button
      variant={getButtonVariant()}
      size="icon"
      className="h-8 w-8"
      onClick={handlePlay}
      title={
        availableDevices.length === 0
          ? "Nur Preview verfügbar - Öffne Spotify für vollständige Wiedergabe"
          : "Song abspielen"
      }
    >
      {getButtonIcon()}
    </Button>
  )
}
