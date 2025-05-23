"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { useSpotify } from "@/hooks/use-spotify"
import { Share2, Download, Heart, Loader2 } from "lucide-react"

interface PlaylistActionsProps {
  playlistId: string
}

export function PlaylistActions({ playlistId }: PlaylistActionsProps) {
  const { accessToken } = useSpotify()
  const [isSaving, setSaving] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const saveToLibrary = async () => {
    if (!accessToken) return

    setSaving(true)

    try {
      await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/followers`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      setIsLiked(true)
      toast({
        title: "Playlist gespeichert",
        description: "Die Playlist wurde zu deiner Bibliothek hinzugefügt.",
      })
    } catch (error) {
      console.error("Fehler beim Speichern der Playlist:", error)
      toast({
        title: "Fehler",
        description: "Die Playlist konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const sharePlaylist = () => {
    if (navigator.share) {
      navigator.share({
        title: "NeuroTunes Playlist",
        text: "Schau dir diese Playlist an, die ich mit NeuroTunes erstellt habe!",
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link kopiert",
        description: "Der Playlist-Link wurde in die Zwischenablage kopiert.",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Playlist-Aktionen</CardTitle>
        <CardDescription>Speichere oder teile diese Playlist</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={saveToLibrary}
          disabled={isSaving || isLiked}
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Heart className={`mr-2 h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
          )}
          {isLiked ? "Gespeichert" : "Zu Bibliothek hinzufügen"}
        </Button>

        <Button variant="outline" className="w-full justify-start" onClick={sharePlaylist}>
          <Share2 className="mr-2 h-4 w-4" />
          Playlist teilen
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => window.open(`https://open.spotify.com/playlist/${playlistId}`)}
        >
          <Download className="mr-2 h-4 w-4" />
          In Spotify öffnen
        </Button>
      </CardContent>
    </Card>
  )
}
