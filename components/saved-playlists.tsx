"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Play, Music } from "lucide-react"
import { useSpotify } from "@/hooks/use-spotify"

export function SavedPlaylists() {
  const { accessToken } = useSpotify()
  const [playlists, setPlaylists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (accessToken) {
      fetchPlaylists()
    }
  }, [accessToken])

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me/playlists?limit=10", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      // Filtere nur NeuroTunes-Playlists
      const neuroTunesPlaylists = data.items.filter(
        (playlist: any) => playlist.name.includes("NeuroTunes") || playlist.description.includes("NeuroTunes"),
      )

      setPlaylists(neuroTunesPlaylists)
    } catch (error) {
      console.error("Fehler beim Abrufen der Playlists:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deine Playlists</CardTitle>
          <CardDescription>Deine gespeicherten NeuroTunes-Playlists</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="space-y-2">
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

  if (playlists.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deine Playlists</CardTitle>
          <CardDescription>Deine gespeicherten NeuroTunes-Playlists</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Playlists gefunden</h3>
            <p className="text-muted-foreground mb-4">
              Du hast noch keine NeuroTunes-Playlists erstellt oder gespeichert.
            </p>
            <Button asChild>
              <Link href="/#playlist-generator">Playlist erstellen</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deine Playlists</CardTitle>
        <CardDescription>Deine gespeicherten NeuroTunes-Playlists</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="flex gap-3 p-2 rounded-md hover:bg-muted transition-colors"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-md">
                {playlist.images?.[0]?.url ? (
                  <Image
                    src={playlist.images[0].url || "/placeholder.svg"}
                    alt={playlist.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-800 flex items-center justify-center">
                    <Music className="h-6 w-6 text-white opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-medium line-clamp-1">{playlist.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{playlist.tracks.total} Songs</p>
              </div>
            </Link>
          ))}
        </div>

        {playlists.length > 0 && (
          <div className="mt-4 text-center">
            <Button variant="link" asChild>
              <Link href="/dashboard/playlists">Alle Playlists anzeigen</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
