"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSpotify } from "@/hooks/use-spotify"
import { Clock } from "lucide-react"

export function ListeningHistoryCard() {
  const { accessToken } = useSpotify()
  const [recentTracks, setRecentTracks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (accessToken) {
      fetchRecentlyPlayed()
    }
  }, [accessToken])

  const fetchRecentlyPlayed = async () => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=20", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await response.json()
      setRecentTracks(data.items || [])
    } catch (error) {
      console.error("Fehler beim Laden der Hörhistorie:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Kürzlich gehört
          </CardTitle>
          <CardDescription>Deine letzten gespielten Songs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-full max-w-[200px]" />
                  <Skeleton className="h-3 w-full max-w-[160px]" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Kürzlich gehört
        </CardTitle>
        <CardDescription>Deine letzten gespielten Songs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {recentTracks.map((item, index) => (
            <div
              key={`${item.track.id}-${item.played_at}-${index}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="relative h-10 w-10 rounded overflow-hidden">
                <Image
                  src={item.track.album.images[0]?.url || "/placeholder.svg?height=40&width=40"}
                  alt={item.track.album.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate text-sm">{item.track.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {item.track.artists.map((artist: any) => artist.name).join(", ")}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(item.played_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>
        {recentTracks.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">Keine kürzlich gespielten Songs verfügbar</p>
        )}
      </CardContent>
    </Card>
  )
}
