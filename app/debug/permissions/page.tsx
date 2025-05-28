"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ReauthButton } from "@/components/reauth-button"
import { Loader2, CheckCircle, XCircle, RefreshCw, AlertTriangle } from "lucide-react"

export default function PermissionsDebugPage() {
  const [permissionsData, setPermissionsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPermissions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug/permissions")

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }

      const data = await response.json()
      setPermissionsData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
      console.error("Fehler beim Abrufen der Berechtigungen:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [])

  const getStatusIcon = (condition: boolean) => {
    return condition ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (status: number | string) => {
    if (status === 200 || status === 201 || status === 204) {
      return <Badge className="bg-green-500">OK ({status})</Badge>
    } else if (status === 401 || status === 403) {
      return <Badge variant="destructive">Nicht autorisiert ({status})</Badge>
    } else if (status === 429) {
      return <Badge variant="destructive">Rate Limit ({status})</Badge>
    } else {
      return <Badge variant="outline">Fehler ({status})</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
            <p>Prüfe API-Berechtigungen...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Fehler beim Prüfen der Berechtigungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <div className="flex gap-4">
              <Button onClick={fetchPermissions}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Erneut versuchen
              </Button>
              <ReauthButton />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasPermissionIssues =
    permissionsData && permissionsData.permissions && Object.values(permissionsData.permissions).some((p: any) => !p.ok)

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Spotify API-Berechtigungen</h1>
        <Button onClick={fetchPermissions}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Aktualisieren
        </Button>
      </div>

      {hasPermissionIssues && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-600">Berechtigungsprobleme gefunden</h3>
            </div>
            <p className="text-sm text-red-600 mb-4">
              Einige API-Endpunkte sind nicht zugänglich. Dies kann die Funktionalität der App einschränken.
            </p>
            <ReauthButton />
          </CardContent>
        </Card>
      )}

      {/* Session Info */}
      {permissionsData?.session && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Session-Informationen</CardTitle>
            <CardDescription>Details zur aktuellen Spotify-Session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Benutzer:</span>
                <span>{permissionsData.session.user?.name || "Nicht angemeldet"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Token gültig bis:</span>
                <span>{permissionsData.session.tokenExpiry || "Unbekannt"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Session-Fehler:</span>
                <span>{permissionsData.session.error || "Keiner"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Permissions */}
      {permissionsData?.permissions && (
        <Card>
          <CardHeader>
            <CardTitle>API-Endpunkte</CardTitle>
            <CardDescription>Status der Spotify API-Endpunkte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(permissionsData.permissions).map(([name, data]: [string, any]) => (
                <div key={name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(data.ok)}
                    <span className="font-medium">{name}</span>
                  </div>
                  <div>{getStatusBadge(data.status)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex justify-center">
        <ReauthButton />
      </div>
    </div>
  )
}
