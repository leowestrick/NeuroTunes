"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSpotify } from "@/hooks/use-spotify"
import { Users, ExternalLink } from "lucide-react"

export function TopArtistsCard() {
  const { accessToken } = useSpotify()
  const [artists, setArtists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"short_term" | "medium_term" | "long_term">("medium_term")

  useEffect(() => {
    if (accessToken) {
      fetchTopArtists()
    }
  }, [accessToken, timeRange])

  const fetchTopArtists = async () => {
    setLoading(true)
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await response.json()
      setArtists(data.items || [])
    } catch (error) {
      console.error("Fehler beim Laden der Top-Künstler:", error)
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
            <Users className="h-5 w-5" />
            Deine Top-Künstler
          </CardTitle>
          <CardDescription>Deine meistgehörten Künstler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
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
              <Users className="h-5 w-5" />
              Deine Top-Künstler
            </CardTitle>
            <CardDescription>Deine meistgehörten Künstler</CardDescription>
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
          {artists.map((artist, index) => (
            <div key={artist.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}</span>
                <div className="relative h-12 w-12 rounded-full overflow-hidden">
                  <Image
                    src={artist.images[0]?.url || "/placeholder.svg?height=48&width=48"}
                    alt={artist.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium">{artist.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {artist.followers.total.toLocaleString()} Follower
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => window.open(artist.external_urls.spotify, "_blank")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        {artists.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            Keine Top-Künstler für {timeRangeLabels[timeRange]} verfügbar
          </p>
        )}
      </CardContent>
    </Card>
  )
}
