"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useSpotify } from "@/hooks/use-spotify"
import { TrendingUp } from "lucide-react"

export function TopGenresCard() {
  const { accessToken } = useSpotify()
  const [genres, setGenres] = useState<Array<{ genre: string; count: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (accessToken) {
      fetchTopGenres()
    }
  }, [accessToken])

  const fetchTopGenres = async () => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await response.json()

      // Sammle alle Genres und zähle sie
      const genreCount: Record<string, number> = {}
      data.items.forEach((artist: any) => {
        artist.genres.forEach((genre: string) => {
          genreCount[genre] = (genreCount[genre] || 0) + 1
        })
      })

      // Sortiere nach Häufigkeit
      const sortedGenres = Object.entries(genreCount)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15)

      setGenres(sortedGenres)
    } catch (error) {
      console.error("Fehler beim Laden der Top-Genres:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Deine Top-Genres
          </CardTitle>
          <CardDescription>Deine meistgehörten Musikrichtungen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
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
          <TrendingUp className="h-5 w-5" />
          Deine Top-Genres
        </CardTitle>
        <CardDescription>Deine meistgehörten Musikrichtungen</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {genres.map((item, index) => (
            <Badge
              key={item.genre}
              variant={index < 3 ? "default" : index < 6 ? "secondary" : "outline"}
              className="text-xs"
            >
              {item.genre} ({item.count})
            </Badge>
          ))}
        </div>
        {genres.length === 0 && <p className="text-muted-foreground text-sm">Keine Genre-Daten verfügbar</p>}
      </CardContent>
    </Card>
  )
}
