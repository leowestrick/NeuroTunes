"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSpotify } from "@/hooks/use-spotify"
import { Calendar, MapPin, Users, ExternalLink, Settings } from "lucide-react"

export function ProfileHeader() {
  const { user } = useSpotify()
  const [imageError, setImageError] = useState(false)

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="w-32 h-32 bg-muted rounded-full mx-auto"></div>
            <div className="h-8 bg-muted rounded w-48 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
      <CardContent className="relative p-6">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
          {/* Profile Picture */}
          <div className="relative -mt-16 md:-mt-20">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background overflow-hidden bg-muted">
              {user.images?.[0]?.url && !imageError ? (
                <Image
                  src={user.images[0].url || "/placeholder.svg"}
                  alt={user.display_name}
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-4xl font-bold text-emerald-600">{user.display_name?.charAt(0) || "U"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold">{user.display_name}</h1>
              <p className="text-muted-foreground">@{user.id}</p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {user.country && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{user.country}</span>
                </div>
              )}
              {user.followers && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{user.followers.total.toLocaleString()} Follower</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Mitglied seit {new Date().getFullYear()}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{user.product === "premium" ? "Spotify Premium" : "Spotify Free"}</Badge>
              {user.explicit_content?.filter_enabled && <Badge variant="outline">Jugendschutz aktiviert</Badge>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open(user.external_urls?.spotify, "_blank")}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Spotify Profil
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Einstellungen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
