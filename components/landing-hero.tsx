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
    <div>

        {isAuthenticated ? (
          <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white" asChild>
            <Link href="/dashboard">Login erfolgreich zum Dashboard</Link>
          </Button>
        ) : (
          <SpotifyLoginButton size="lg" className="bg-[#1DB954] hover:bg-[#1ed760] text-white px-8 py-6 text-lg">
            Mit Spotify anmelden und loslegen
          </SpotifyLoginButton>
        )}

    </div>
  )
}
