"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSpotify } from "@/hooks/use-spotify"
import { Music, Heart, Users, Clock } from "lucide-react"

interface ProfileStats {
  totalPlaylists: number
  savedTracks: number
  followedArtists: number
  listeningTime: string
}

export function ProfileStats() {
  const { accessToken } = useSpotify()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (accessToken) {
      fetchStats()
    }
  }, [accessToken])

  const fetchStats = async () => {
    try {
      const [playlistsRes, tracksRes, artistsRes] = await Promise.all([
        fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch("https://api.spotify.com/v1/me/tracks?limit=1", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch("https://api.spotify.com/v1/me/following?type=artist&limit=1", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ])

      const [playlists, tracks, artists] = await Promise.all([playlistsRes.json(), tracksRes.json(), artistsRes.json()])

      setStats({
        totalPlaylists: playlists.total || 0,
        savedTracks: tracks.total || 0,
        followedArtists: artists.artists?.total || 0,
        listeningTime: "Nicht verfügbar", // Spotify API bietet diese Daten nicht direkt
      })
    } catch (error) {
      console.error("Fehler beim Laden der Statistiken:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deine Statistiken</CardTitle>
          <CardDescription>Deine Spotify-Aktivitäten im Überblick</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const statItems = [
    {
      icon: Music,
      label: "Playlists",
      value: stats?.totalPlaylists.toLocaleString() || "0",
      color: "text-blue-500",
    },
    {
      icon: Heart,
      label: "Gespeicherte Songs",
      value: stats?.savedTracks.toLocaleString() || "0",
      color: "text-red-500",
    },
    {
      icon: Users,
      label: "Gefolgte Künstler",
      value: stats?.followedArtists.toLocaleString() || "0",
      color: "text-green-500",
    },
    {
      icon: Clock,
      label: "Hörzeit",
      value: stats?.listeningTime || "N/A",
      color: "text-purple-500",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deine Statistiken</CardTitle>
        <CardDescription>Deine Spotify-Aktivitäten im Überblick</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statItems.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-muted ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">{item.value}</div>
              <div className="text-sm text-muted-foreground">{item.label}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
