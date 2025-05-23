"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Play, Pause, Heart, MoreHorizontal } from "lucide-react"
import { useSpotify } from "@/hooks/use-spotify"
import { formatDuration } from "@/lib/utils"

interface PlaylistTracksProps {
  playlistId: string
}

export function PlaylistTracks({ playlistId }: PlaylistTracksProps) {
  const { accessToken } = useSpotify()
  const [tracks, setTracks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (accessToken) {
      fetchTracks()
      fetchLikedTracks()
    }
  }, [accessToken, playlistId])

  const fetchTracks = async () => {
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()
      setTracks(data.items.map((item: any) => item.track))
    } catch (error) {
      console.error("Fehler beim Abrufen der Tracks:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLikedTracks = async () => {
    try {
      const trackIds = tracks.map((track) => track.id).join(",")
      if (!trackIds) return

      const response = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${trackIds}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      const newLikedTracks = new Set<string>()
      tracks.forEach((track, index) => {
        if (data[index]) {
          newLikedTracks.add(track.id)
        }
      })

      setLikedTracks(newLikedTracks)
    } catch (error) {
      console.error("Fehler beim Abrufen der Liked-Status:", error)
    }
  }

  const togglePlay = (trackId: string) => {
    if (currentlyPlaying === trackId) {
      setCurrentlyPlaying(null)
    } else {
      setCurrentlyPlaying(trackId)
    }
  }

  const toggleLike = async (trackId: string) => {
    try {
      const method = likedTracks.has(trackId) ? "DELETE" : "PUT"

      await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      setLikedTracks((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(trackId)) {
          newSet.delete(trackId)
        } else {
          newSet.add(trackId)
        }
        return newSet
      })
    } catch (error) {
      console.error("Fehler beim Ändern des Like-Status:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 p-2">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full max-w-[200px]" />
              <Skeleton className="h-3 w-full max-w-[160px]" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <div className="grid grid-cols-12 text-sm font-medium text-muted-foreground">
          <div className="col-span-1">#</div>
          <div className="col-span-6">Titel</div>
          <div className="col-span-3">Album</div>
          <div className="col-span-2 text-right">Dauer</div>
        </div>
      </div>

      <div className="divide-y">
        {tracks.map((track, index) => (
          <div key={track.id} className="grid grid-cols-12 items-center p-2 hover:bg-muted/50 group">
            <div className="col-span-1 flex items-center justify-center">
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="group-hover:hidden">{index + 1}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden group-hover:flex h-8 w-8"
                  onClick={() => togglePlay(track.id)}
                >
                  {currentlyPlaying === track.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="col-span-6 flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded">
                <Image
                  src={track.album.images[0]?.url || "/placeholder.svg?height=40&width=40"}
                  alt={track.album.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{track.name}</div>
                <div className="truncate text-sm text-muted-foreground">
                  {track.artists.map((artist: any) => artist.name).join(", ")}
                </div>
              </div>
            </div>

            <div className="col-span-3 truncate text-sm text-muted-foreground">{track.album.name}</div>

            <div className="col-span-2 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => toggleLike(track.id)}
              >
                <Heart className={`h-4 w-4 ${likedTracks.has(track.id) ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <span className="text-sm text-muted-foreground">{formatDuration(track.duration_ms)}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
