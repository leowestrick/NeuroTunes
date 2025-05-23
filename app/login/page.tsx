import { SpotifyLoginButton } from "@/components/spotify-login-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-900 to-emerald-700 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <Music className="h-6 w-6 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl">Anmelden bei NeuroTunes</CardTitle>
          <CardDescription>
            Melde dich mit deinem Spotify-Konto an, um personalisierte Playlists zu erstellen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SpotifyLoginButton className="w-full">Mit Spotify fortfahren</SpotifyLoginButton>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="underline underline-offset-4 hover:text-primary">
              Zurück zur Startseite
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
