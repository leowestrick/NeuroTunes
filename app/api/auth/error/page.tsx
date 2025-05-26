"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home, ArrowLeft } from "lucide-react"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  // Fehlertypen und Meldungen
  const errorMessages: Record<string, string> = {
    Configuration: "Es liegt ein Problem mit der NextAuth-Konfiguration vor.",
    AccessDenied: "Du hast den Zugriff auf dein Spotify-Konto abgelehnt.",
    Verification: "Der Verifizierungslink ist ungültig oder abgelaufen.",
    OAuthSignin: "Es gab ein Problem beim Start des Spotify-Logins.",
    OAuthCallback: "Es gab ein Problem bei der Rückkehr von Spotify.",
    OAuthCreateAccount: "Es konnte kein Konto mit deinem Spotify-Profil erstellt werden.",
    EmailCreateAccount: "Es konnte kein Konto mit deiner E-Mail-Adresse erstellt werden.",
    Callback: "Es gab ein Problem bei der Verarbeitung der Anmeldung.",
    OAuthAccountNotLinked: "Dieses Konto ist bereits mit einer anderen Anmeldung verknüpft.",
    default: "Bei der Anmeldung ist ein unbekannter Fehler aufgetreten.",
  }

  const errorMessage = error ? errorMessages[error] || errorMessages.default : errorMessages.default

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Authentifizierungsfehler</h1>
          <p className="mt-2 text-muted-foreground">{errorMessage}</p>
          <p className="mt-1 text-sm text-muted-foreground">Fehlercode: {error || "unknown"}</p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Zurück zur Startseite
              </Link>
            </Button>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Erneut versuchen
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
