"use client"

import { useEffect, useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react"

export default function DebugPage() {
  const { data: session, status } = useSession()
  const [debugData, setDebugData] = useState<any>(null)
  const [spotifyTest, setSpotifyTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchDebugData = async () => {
    setLoading(true)
    try {
      const [authResponse, spotifyResponse] = await Promise.all([fetch("/api/debug/auth"), fetch("/api/test-spotify")])

      const authData = await authResponse.json()
      const spotifyData = await spotifyResponse.json()

      setDebugData(authData)
      setSpotifyTest(spotifyData)
    } catch (error) {
      console.error("Debug fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [session])

  const getStatusIcon = (condition: boolean) => {
    return condition ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (condition: boolean, trueText: string, falseText: string) => {
    return <Badge variant={condition ? "default" : "destructive"}>{condition ? trueText : falseText}</Badge>
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">NeuroTunes Debug Dashboard</h1>
        <Button onClick={fetchDebugData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Aktualisieren
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Session Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(status === "authenticated")}
              Session Status
            </CardTitle>
            <CardDescription>Aktueller Authentifizierungsstatus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Status:</strong> {getStatusBadge(status === "authenticated", "Authenticated", status)}
              </div>
              <div>
                <strong>Loading:</strong> {getStatusBadge(!loading, "Ready", "Loading")}
              </div>
            </div>

            {session && (
              <div className="space-y-2">
                <div>
                  <strong>User:</strong> {session.user?.name || "N/A"}
                </div>
                <div>
                  <strong>Email:</strong> {session.user?.email || "N/A"}
                </div>
                <div>
                  <strong>Access Token:</strong> {session.accessToken ? "✓ Present" : "✗ Missing"}
                </div>
                <div>
                  <strong>Error:</strong> {session.error || "None"}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => signIn("spotify")} variant="outline">
                Login with Spotify
              </Button>
              <Button onClick={() => signOut()} variant="outline">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Environment Check */}
        {debugData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(debugData.environment.spotifyClientId && debugData.environment.spotifyClientSecret)}
                Environment Configuration
              </CardTitle>
              <CardDescription>Überprüfung der Umgebungsvariablen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugData.environment.nextauthUrl)}
                  <span>NEXTAUTH_URL: {debugData.environment.nextauthUrl || "Missing"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugData.environment.nextauthSecret)}
                  <span>NEXTAUTH_SECRET: {debugData.environment.nextauthSecret ? "Set" : "Missing"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugData.environment.spotifyClientId)}
                  <span>SPOTIFY_CLIENT_ID: {debugData.environment.spotifyClientIdValue || "Missing"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugData.environment.spotifyClientSecret)}
                  <span>SPOTIFY_CLIENT_SECRET: {debugData.environment.spotifyClientSecret ? "Set" : "Missing"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Spotify API Test */}
        {spotifyTest && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(spotifyTest.success)}
                Spotify API Connectivity
              </CardTitle>
              <CardDescription>Test der Spotify API Verbindung</CardDescription>
            </CardHeader>
            <CardContent>
              {spotifyTest.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Spotify API connection successful</span>
                  </div>
                  <div>
                    <strong>Token Type:</strong> {spotifyTest.tokenType}
                  </div>
                  <div>
                    <strong>Expires In:</strong> {spotifyTest.expiresIn} seconds
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>Spotify API connection failed</span>
                  </div>
                  <div>
                    <strong>Error:</strong> {spotifyTest.error}
                  </div>
                  {spotifyTest.details && (
                    <pre className="bg-muted p-2 rounded text-sm overflow-auto">
                      {JSON.stringify(spotifyTest.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* URLs */}
        {debugData?.urls && (
          <Card>
            <CardHeader>
              <CardTitle>Authentication URLs</CardTitle>
              <CardDescription>Relevante URLs für die Authentifizierung</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                <div>
                  <strong>Base URL:</strong> {debugData.urls.baseUrl}
                </div>
                <div>
                  <strong>Callback URL:</strong> {debugData.urls.callbackUrl}
                </div>
                <div>
                  <strong>Sign In URL:</strong> {debugData.urls.signInUrl}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raw Debug Data */}
        {debugData && (
          <Card>
            <CardHeader>
              <CardTitle>Raw Debug Data</CardTitle>
              <CardDescription>Vollständige Debug-Informationen</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify({ debugData, spotifyTest, session }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
