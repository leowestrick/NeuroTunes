import { SpotifyLoginButton } from "@/components/spotify-login-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Shield, Zap, Users } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-900 to-emerald-700 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Login Card */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Music className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Anmelden bei NeuroTunes</CardTitle>
            <CardDescription>
              Melde dich mit deinem Spotify-Konto an, um personalisierte Playlists mit KI zu erstellen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SpotifyLoginButton className="w-full h-12 text-lg">Mit Spotify fortfahren</SpotifyLoginButton>

            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>
                Kein Spotify-Konto?{" "}
                <a
                  href="https://www.spotify.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  Jetzt kostenlos registrieren
                </a>
              </p>
              <p>
                <Link href="/" className="text-emerald-600 hover:underline">
                  Zurück zur Startseite
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="text-white space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-4">Warum NeuroTunes?</h2>
            <p className="text-emerald-100 text-lg">
              Entdecke Musik wie nie zuvor mit unserer KI-gestützten Playlist-Generierung.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">KI-Personalisierung</h3>
                <p className="text-emerald-100 text-sm">
                  Unsere KI analysiert deine Hörgewohnheiten und erstellt perfekt passende Playlists.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Sicher & Privat</h3>
                <p className="text-emerald-100 text-sm">
                  Deine Daten bleiben sicher. Wir verwenden nur die nötigen Spotify-Berechtigungen.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Für alle Spotify-Nutzer</h3>
                <p className="text-emerald-100 text-sm">Funktioniert mit kostenlosen und Premium Spotify-Konten.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
