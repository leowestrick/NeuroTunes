"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Home, RefreshCw } from "lucide-react"
import { SpotifyLoginButton } from "@/components/spotify-login-button"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  // Fehlertypen und Meldungen
  const errorMessages: Record<string, { title: string; description: string; action?: string }> = {
    Configuration: {
      title: "Konfigurationsfehler",
      description: "Es liegt ein Problem mit der Spotify-Konfiguration vor. Bitte kontaktiere den Support.",
    },
    AccessDenied: {
      title: "Zugriff verweigert",
      description:
        "Du hast den Zugriff auf dein Spotify-Konto abgelehnt. Ohne Berechtigung können wir keine Playlists erstellen.",
      action: "retry",
    },
    Verification: {
      title: "Verifizierungsfehler",
      description: "Der Verifizierungslink ist ungültig oder abgelaufen. Bitte versuche dich erneut anzumelden.",
      action: "retry",
    },
    OAuthSignin: {
      title: "OAuth-Fehler",
      description: "Es gab ein Problem beim Start des Spotify-Logins. Bitte versuche es erneut.",
      action: "retry",
    },
    OAuthCallback: {
      title: "Callback-Fehler",
      description: "Es gab ein Problem bei der Rückkehr von Spotify. Möglicherweise wurde der Vorgang abgebrochen.",
      action: "retry",
    },
    OAuthCreateAccount: {
      title: "Account-Erstellung fehlgeschlagen",
      description: "Es konnte kein Konto mit deinem Spotify-Profil erstellt werden. Bitte versuche es erneut.",
      action: "retry",
    },
    EmailCreateAccount: {
      title: "E-Mail-Account-Fehler",
      description: "Es konnte kein Konto mit deiner E-Mail-Adresse erstellt werden.",
    },
    Callback: {
      title: "Allgemeiner Callback-Fehler",
      description: "Es gab ein Problem bei der Verarbeitung der Anmeldung. Bitte versuche es erneut.",
      action: "retry",
    },
    OAuthAccountNotLinked: {
      title: "Account bereits verknüpft",
      description: "Dieses Spotify-Konto ist bereits mit einer anderen Anmeldung verknüpft.",
    },
    default: {
      title: "Unbekannter Fehler",
      description: "Bei der Anmeldung ist ein unbekannter Fehler aufgetreten. Bitte versuche es erneut.",
      action: "retry",
    },
  }

  const errorInfo = error ? errorMessages[error] || errorMessages.default : errorMessages.default

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-red-50 to-orange-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-red-800">{errorInfo.title}</CardTitle>
          <CardDescription className="text-red-600">{errorInfo.description}</CardDescription>
          {error && <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">Fehlercode: {error}</div>}
        </CardHeader>
        <CardContent className="space-y-4">
          {errorInfo.action === "retry" && (
            <SpotifyLoginButton className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Erneut mit Spotify anmelden
            </SpotifyLoginButton>
          )}

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Zurück zur Startseite
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Probleme beim Anmelden?</p>
            <p>
              Stelle sicher, dass du ein{" "}
              <a
                href="https://www.spotify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                gültiges Spotify-Konto
              </a>{" "}
              hast.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
