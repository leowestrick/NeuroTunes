"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, RefreshCw, AlertTriangle } from "lucide-react"

export default function AIDebugPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchDebugData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/ai")
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      console.error("Debug fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  const getStatusIcon = (condition: boolean) => {
    return condition ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (condition: boolean, trueText: string, falseText: string) => {
    return <Badge variant={condition ? "default" : "destructive"}>{condition ? trueText : falseText}</Badge>
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
            <p>Teste Google AI API...</p>
          </CardContent>
        </Card>
      </div>
    \
            <p>Teste Google AI API...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Google AI API Debug</h1>
        <Button onClick={fetchDebugData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Aktualisieren
        </Button>
      </div>

      {debugData?.error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-600">API-Problem gefunden</h3>
            </div>
            <p className="text-sm text-red-600">{debugData.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Environment Info */}
      {debugData?.environment && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(debugData.environment.hasGoogleAIKey)}
              Umgebungsvariablen
            </CardTitle>
            <CardDescription>Status der Google AI API-Konfiguration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Environment:</strong> {debugData.environment.nodeEnv}
              </div>
              <div>
                <strong>API Key vorhanden:</strong> {getStatusBadge(debugData.environment.hasGoogleAIKey, "Ja", "Nein")}
              </div>
              <div>
                <strong>Key Länge:</strong> {debugData.environment.keyLength} Zeichen
              </div>
              <div>
                <strong>Key Prefix:</strong> {debugData.environment.keyPrefix}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Test Results */}
      {debugData?.test && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(debugData.test.success)}
              Google AI API Test
            </CardTitle>
            <CardDescription>Ergebnis des API-Verbindungstests</CardDescription>
          </CardHeader>
          <CardContent>
            {debugData.test.success ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>API-Test erfolgreich</span>
                </div>
                <div>
                  <strong>Antwort:</strong> "{debugData.test.response}"
                </div>
                <div>
                  <strong>Antwort-Länge:</strong> {debugData.test.responseLength} Zeichen
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span>API-Test fehlgeschlagen</span>
                </div>
                <div>
                  <strong>Fehler:</strong> {debugData.test.error}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Raw Debug Data */}
      {debugData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Raw Debug Data</CardTitle>
            <CardDescription>Vollständige Debug-Informationen</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
