"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Music } from "lucide-react"
import { useSpotify } from "@/hooks/use-spotify"
import { cn } from "@/lib/utils"

interface RecentActivityProps {
  className?: string
}

export function RecentActivity({ className }: RecentActivityProps) {
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
      const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=5", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()
      setRecentTracks(data.items || [])
    } catch (error) {
      console.error("Fehler beim Abrufen der kürzlich gespielten Tracks:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Kürzlich gehört</CardTitle>
        <CardDescription>Deine zuletzt gespielten Songs</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-full max-w-[200px]" />
                  <Skeleton className="h-3 w-full max-w-[160px]" />
                </div>
              </div>
            ))}
          </div>
        ) : recentTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine kürzlich gespielten Songs</h3>
            <p className="text-muted-foreground">Höre einige Songs, um deinen Verlauf zu sehen.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTracks.map((item) => (
              <div
                key={`${item.track.id}-${item.played_at}`}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors"
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-md">
                  <Image
                    src={item.track.album.images[0]?.url || "/placeholder.svg?height=40&width=40"}
                    alt={item.track.album.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium truncate">{item.track.name}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {item.track.artists.map((artist: any) => artist.name).join(", ")}
                  </p>
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
        )}
      </CardContent>
    </Card>
  )
}
