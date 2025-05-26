"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

export default function DebugPage() {
  const { data: session, status } = useSession()
  const [apiTest, setApiTest] = useState<any>(null)

  useEffect(() => {
    // Teste die API-Verbindung
    fetch("/api/test")
      .then((res) => res.json())
      .then((data) => setApiTest(data))
      .catch((error) => setApiTest({ error: error.message }))
  }, [])

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Debug-Informationen</h1>

      <div className="grid gap-6">
        {/* API Test */}
        <Card>
          <CardHeader>
            <CardTitle>API-Test</CardTitle>
            <CardDescription>Überprüfung der grundlegenden API-Funktionalität</CardDescription>
          </CardHeader>
          <CardContent>
            {apiTest ? (
              <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">{JSON.stringify(apiTest, null, 2)}</pre>
            ) : (
              <p>Lade API-Test...</p>
            )}
          </CardContent>
        </Card>

        {/* Session Status */}
        <Card>
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
            <CardDescription>Aktueller Authentifizierungsstatus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Status:</strong> {status}
              </div>

              {session ? (
                <div className="space-y-2">
                  <div>
                    <strong>Benutzer:</strong> {session.user?.name || "Nicht verfügbar"}
                  </div>
                  <div>
                    <strong>E-Mail:</strong> {session.user?.email || "Nicht verfügbar"}
                  </div>
                  <div>
                    <strong>Access Token:</strong> {session.accessToken ? "Vorhanden" : "Nicht verfügbar"}
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium">Session Details</summary>
                    <pre className="bg-muted p-4 rounded-md overflow-auto text-sm mt-2">
                      {JSON.stringify(session, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <p>Keine aktive Session</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Login Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Authentifizierung</CardTitle>
            <CardDescription>Login- und Logout-Funktionen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => signIn("spotify")} disabled={status === "loading"}>
                Mit Spotify anmelden
              </Button>

              <Button
                onClick={() => signIn("spotify", { callbackUrl: "/dashboard" })}
                disabled={status === "loading"}
                variant="outline"
              >
                Mit Spotify anmelden (Dashboard)
              </Button>

              <Button onClick={() => signOut()} disabled={!session} variant="destructive">
                Abmelden
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Environment Check */}
        <Card>
          <CardHeader>
            <CardTitle>Umgebung</CardTitle>
            <CardDescription>Überprüfung der Umgebungsvariablen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <strong>NODE_ENV:</strong> {process.env.NODE_ENV}
              </div>
              <div>
                <strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL || "Nicht gesetzt"}
              </div>
              <div>
                <strong>Aktuelle URL:</strong> {typeof window !== "undefined" ? window.location.origin : "Server"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NextAuth Test */}
        <Card>
          <CardHeader>
            <CardTitle>NextAuth API Test</CardTitle>
            <CardDescription>Direkte Überprüfung der NextAuth-Endpunkte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  fetch("/api/auth/session")
                    .then((res) => res.json())
                    .then((data) => console.log("Session API:", data))
                    .catch((error) => console.error("Session API Error:", error))
                }}
                variant="outline"
                size="sm"
              >
                Test Session API
              </Button>

              <Button
                onClick={() => {
                  fetch("/api/auth/providers")
                    .then((res) => res.json())
                    .then((data) => console.log("Providers API:", data))
                    .catch((error) => console.error("Providers API Error:", error))
                }}
                variant="outline"
                size="sm"
              >
                Test Providers API
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Ergebnisse werden in der Browser-Konsole angezeigt</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
