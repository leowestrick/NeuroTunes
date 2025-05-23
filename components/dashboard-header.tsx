"use client"

import { useSpotify } from "@/hooks/use-spotify"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Music } from "lucide-react"

export function DashboardHeader() {
  const { user } = useSpotify()

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hallo, {user?.display_name || "Musikliebhaber"}!</h1>
        <p className="text-muted-foreground">Entdecke deine personalisierten Playlists und Musikvorlieben.</p>
      </div>

      <Button asChild>
        <Link href="/#playlist-generator" className="flex items-center">
          <Music className="mr-2 h-4 w-4" />
          Neue Playlist erstellen
        </Link>
      </Button>
    </div>
  )
}
