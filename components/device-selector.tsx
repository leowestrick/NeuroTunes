"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSpotify } from "@/hooks/use-spotify"
import { toast } from "@/hooks/use-toast"
import { Smartphone, Monitor, Speaker, Headphones, RefreshCw } from "lucide-react"

interface Device {
  id: string
  is_active: boolean
  is_private_session: boolean
  is_restricted: boolean
  name: string
  type: string
  volume_percent: number
}

export function DeviceSelector() {
  const { accessToken } = useSpotify()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (accessToken) {
      fetchDevices()
    }
  }, [accessToken])

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDevices(data.devices)
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Geräte:", error)
      toast({
        title: "Fehler",
        description: "Geräte konnten nicht abgerufen werden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const activateDevice = async (deviceId: string) => {
    try {
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      })

      toast({
        title: "Gerät aktiviert",
        description: "Das Gerät wurde erfolgreich aktiviert.",
      })

      // Aktualisiere die Geräteliste
      fetchDevices()
    } catch (error) {
      console.error("Fehler beim Aktivieren des Geräts:", error)
      toast({
        title: "Fehler",
        description: "Gerät konnte nicht aktiviert werden.",
        variant: "destructive",
      })
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "computer":
        return <Monitor className="h-4 w-4" />
      case "smartphone":
        return <Smartphone className="h-4 w-4" />
      case "speaker":
        return <Speaker className="h-4 w-4" />
      default:
        return <Headphones className="h-4 w-4" />
    }
  }

  if (!accessToken) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Spotify-Geräte</CardTitle>
            <CardDescription>Wähle ein Gerät für die Wiedergabe aus</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={fetchDevices} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">Keine Spotify-Geräte gefunden.</p>
            <p className="text-sm text-muted-foreground mb-4">Öffne Spotify auf einem Gerät, um es hier anzuzeigen.</p>
            <Button variant="outline" onClick={() => window.open("https://open.spotify.com", "_blank")}>
              Spotify Web Player öffnen
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  device.is_active ? "bg-emerald-50 border-emerald-200" : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(device.type)}
                  <div>
                    <div className="font-medium">{device.name}</div>
                    <div className="text-sm text-muted-foreground capitalize">{device.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {device.is_active && <Badge variant="secondary">Aktiv</Badge>}
                  {!device.is_active && (
                    <Button variant="outline" size="sm" onClick={() => activateDevice(device.id)}>
                      Aktivieren
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
