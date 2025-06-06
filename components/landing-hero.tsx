"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SpotifyLoginButton } from "@/components/spotify-login-button"
import { useSpotify } from "@/hooks/use-spotify"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export function LandingHero() {
  const { isAuthenticated } = useSpotify()
  const searchParams = useSearchParams()
  const message = searchParams.get("message")

  return (
    <div className="relative bg-gradient-to-b from-emerald-900 to-emerald-700 text-white py-24 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        {message === "login-required" && (
          <Alert className="mb-6 bg-amber-100 border-amber-300 text-amber-800">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Du musst dich mit Spotify anmelden, um auf diese Funktion zugreifen zu können.
            </AlertDescription>
          </Alert>
        )}

        <h1 className="text-4xl md:text-6xl font-bold mb-6">Entdecke Musik mit der Kraft der KI</h1>
        <p className="text-xl md:text-2xl mb-8 opacity-90">
          Gib einfach Keywords ein und NeuroTunes erstellt dir eine personalisierte Playlist, die perfekt zu deiner
          Stimmung passt.
        </p>

        {isAuthenticated ? (
          <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white" asChild>
            <Link href="#playlist-generator">Playlist erstellen</Link>
          </Button>
        ) : (
          <SpotifyLoginButton size="lg" className="whitespace-break-spaces bg-[#1DB954] hover:bg-[#1ed760] text-white px-8 py-8 text-lg">
            Mit Spotify anmelden und loslegen
          </SpotifyLoginButton>
        )}

        <div className="mt-12 flex justify-center space-x-4">
          <div className="text-center">
            <div className="text-4xl font-bold">1000+</div>
            <div className="text-sm opacity-80">Erstellte Playlists</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold">50M+</div>
            <div className="text-sm opacity-80">Verfügbare Songs</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold">100%</div>
            <div className="text-sm opacity-80">Personalisiert</div>
          </div>
        </div>
      </div>
    </div>
  )
}
