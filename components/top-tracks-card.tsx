"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSpotify } from "@/hooks/use-spotify"
import { formatDuration } from "@/lib/utils"
import { Music, ExternalLink, Play } from "lucide-react"

export function TopTracksCard() {
  const { accessToken } = useSpotify()
  const [tracks, setTracks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"short_term" | "medium_term" | "long_term">("medium_term")

  useEffect(() => {
    if (accessToken) {
      fetchTopTracks()
    }
  }, [accessToken, timeRange])

  const fetchTopTracks = async () => {
    setLoading(true)
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await response.json()
      setTracks(data.items || [])
    } catch (error) {
      console.error("Fehler beim Laden der Top-Tracks:", error)
    } finally {
      setLoading(false)
    }
  }

  const timeRangeLabels = {
    short_term: "Letzte 4 Wochen",
    medium_term: "Letzte 6 Monate",
    long_term: "Alle Zeit",
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Deine Top-Songs
          </CardTitle>
          <CardDescription>Deine meistgehörten Songs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-full max-w-[200px]" />
                  <Skeleton className="h-3 w-full max-w-[160px]" />
                </div>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Deine Top-Songs
            </CardTitle>
            <CardDescription>Deine meistgehörten Songs</CardDescription>
          </div>
          <div className="flex gap-1">
            {Object.entries(timeRangeLabels).map(([range, label]) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range as any)}
              >
                {label.split(" ")[1]}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}</span>
                <div className="relative h-12 w-12 rounded overflow-hidden">
                  <Image
                    src={track.album.images[0]?.url || "/placeholder.svg?height=48&width=48"}
                    alt={track.album.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{track.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {track.artists.map((artist: any) => artist.name).join(", ")}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{formatDuration(track.duration_ms)}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => window.open(track.external_urls.spotify, "_blank")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        {tracks.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            Keine Top-Songs für {timeRangeLabels[timeRange]} verfügbar
          </p>
        )}
      </CardContent>
    </Card>
  )
}
