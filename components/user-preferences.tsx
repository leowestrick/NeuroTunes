"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { X, Plus } from "lucide-react"
import { useSpotify } from "@/hooks/use-spotify"
import { toast } from "@/hooks/use-toast"

export function UserPreferences() {
  const { accessToken } = useSpotify()
  const [topGenres, setTopGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([])

  useEffect(() => {
    if (accessToken) {
      fetchTopArtists()
      loadFavoriteGenres()
    }
  }, [accessToken])

  const fetchTopArtists = async () => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=20", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      // Extrahiere Genres aus den Top-Künstlern
      const allGenres = data.items.flatMap((artist: any) => artist.genres)
      const genreCounts = allGenres.reduce((acc: Record<string, number>, genre: string) => {
        acc[genre] = (acc[genre] || 0) + 1
        return acc
      }, {})

      // Sortiere nach Häufigkeit und nimm die Top 10
      const sortedGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([genre]) => genre)
        .slice(0, 10)

      setTopGenres(sortedGenres)
    } catch (error) {
      console.error("Fehler beim Abrufen der Top-Künstler:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadFavoriteGenres = () => {
    const savedGenres = localStorage.getItem("favoriteGenres")
    if (savedGenres) {
      setFavoriteGenres(JSON.parse(savedGenres))
    }
  }

  const saveFavoriteGenres = (genres: string[]) => {
    localStorage.setItem("favoriteGenres", JSON.stringify(genres))
    setFavoriteGenres(genres)
  }

  const addToFavorites = (genre: string) => {
    if (!favoriteGenres.includes(genre)) {
      const newFavorites = [...favoriteGenres, genre]
      saveFavoriteGenres(newFavorites)
      toast({
        title: "Genre hinzugefügt",
        description: `"${genre}" wurde zu deinen Favoriten hinzugefügt.`,
      })
    }
  }

  const removeFromFavorites = (genre: string) => {
    const newFavorites = favoriteGenres.filter((g) => g !== genre)
    saveFavoriteGenres(newFavorites)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deine Präferenzen</CardTitle>
        <CardDescription>Deine Top-Genres und Favoriten</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Deine Top-Genres</h3>
          {loading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-6 w-16 rounded-full" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topGenres.map((genre) => (
                <div key={genre} className="flex items-center">
                  <Badge variant="outline" className="mr-1">
                    {genre}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full"
                    onClick={() => addToFavorites(genre)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Deine Favoriten-Genres</h3>
          {favoriteGenres.length === 0 ? (
            <p className="text-sm text-muted-foreground">Du hast noch keine Favoriten-Genres hinzugefügt.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {favoriteGenres.map((genre) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                  <button
                    onClick={() => removeFromFavorites(genre)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
