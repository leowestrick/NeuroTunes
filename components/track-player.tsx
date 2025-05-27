"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"
import { useSpotify } from "@/hooks/use-spotify"

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

  const handlePlay = async () => {
    if (!accessToken) return

    try {
      // Versuche über Spotify Web API zu spielen
      const response = await fetch("https://api.spotify.com/v1/me/player/play", {
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
      } else if (response.status === 404) {
        // Kein aktives Gerät gefunden - verwende Preview
        playPreview()
      }
    } catch (error) {
      console.error("Fehler beim Abspielen:", error)
      playPreview()
    }
  }

  const playPreview = () => {
    if (track.preview_url) {
      const audio = new Audio(track.preview_url)
      audio.play()
      setIsPlaying(true)

      audio.addEventListener("ended", () => {
        setIsPlaying(false)
      })
    }
  }

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePlay}>
      {isCurrentlyPlaying || isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
    </Button>
  )
}
