"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { signIn, signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const { data: session, status } = useSession()

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Authentifizierungs-Debug</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Session Status</CardTitle>
          <CardDescription>Aktueller Status der Authentifizierung</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Status:</strong> {status}
            </p>
            {session ? (
              <>
                <p>
                  <strong>Benutzer:</strong> {session.user?.name || "Nicht verfügbar"}
                </p>
                <p>
                  <strong>E-Mail:</strong> {session.user?.email || "Nicht verfügbar"}
                </p>
                <p>
                  <strong>Access Token:</strong>{" "}
                  {session.accessToken ? `${session.accessToken.substring(0, 20)}...` : "Nicht verfügbar"}
                </p>
                <p>
                  <strong>Fehler:</strong> {session.error || "Keiner"}
                </p>
              </>
            ) : (
              <p>Keine aktive Session</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={() => signIn("spotify")}>Mit Spotify anmelden (Standard)</Button>
        <Button
          onClick={() =>
            signIn("spotify", {
              callbackUrl: "/dashboard",
            })
          }
        >
          Mit Spotify anmelden (mit Callback)
        </Button>
        <Button variant="destructive" onClick={() => signOut()}>
          Abmelden
        </Button>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Umgebungsvariablen (nur für Debug)</h2>
        <pre className="bg-muted p-4 rounded-md overflow-auto">
          {`NEXTAUTH_URL: ${process.env.NEXT_PUBLIC_NEXTAUTH_URL || "Nicht gesetzt"}
SPOTIFY_CLIENT_ID: ${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ? "Gesetzt" : "Nicht gesetzt"}
SPOTIFY_CLIENT_SECRET: ${"[Geschützt]"}
NEXTAUTH_SECRET: ${"[Geschützt]"}`}
        </pre>
      </div>
    </div>
  )
}
