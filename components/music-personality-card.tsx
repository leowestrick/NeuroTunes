"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useSpotify } from "@/hooks/use-spotify"
import { analyzeMusicPersonality, type MusicPersonality } from "@/lib/music-personality"
import { Brain, Sparkles, RefreshCw, TrendingUp } from "lucide-react"

export function MusicPersonalityCard() {
  const { accessToken } = useSpotify()
  const [personality, setPersonality] = useState<MusicPersonality | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (accessToken) {
      analyzePersonality()
    }
  }, [accessToken])

  const analyzePersonality = async () => {
    if (!accessToken) return

    setLoading(true)
    setError(null)

    try {
      const result = await analyzeMusicPersonality(accessToken)
      setPersonality(result)
    } catch (error) {
      console.error("Fehler bei der Persönlichkeitsanalyse:", error)
      setError("Persönlichkeitsanalyse konnte nicht durchgeführt werden")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse text-emerald-600" />
            Deine Musikpersönlichkeit
          </CardTitle>
          <CardDescription>KI analysiert deine Hörgewohnheiten...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-emerald-600" />
            Deine Musikpersönlichkeit
          </CardTitle>
          <CardDescription>Entdecke deine einzigartige Musikpersönlichkeit</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={analyzePersonality} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!personality) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-emerald-600" />
            Deine Musikpersönlichkeit
          </CardTitle>
          <CardDescription>Entdecke deine einzigartige Musikpersönlichkeit</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Button onClick={analyzePersonality}>
            <Sparkles className="h-4 w-4 mr-2" />
            Persönlichkeit analysieren
          </Button>
        </CardContent>
      </Card>
    )
  }

  const insights = personality.personalityInsights

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-emerald-600" />
          Deine Musikpersönlichkeit
        </CardTitle>
        <CardDescription>KI-basierte Analyse deiner Hörgewohnheiten</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Persönlichkeitstyp */}
        <div className="rounded-lg bg-[rgb(37,37,40)] pb-6 px-4">
          <div className="text-center p-4">
            <h3 className="text-2xl font-bold mb-2">{insights.musicPersonalityType}</h3>
            <p className="text-[rgb(161,161,170)]">{insights.listeningBehavior}</p>
          </div>

          {/* Audio Features */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Energie</span>
                <span>{Math.round(personality.audioFeatures.energy * 100)}%</span>
              </div>
              <Progress value={personality.audioFeatures.energy * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Positivität</span>
                <span>{Math.round(personality.audioFeatures.valence * 100)}%</span>
              </div>
              <Progress value={personality.audioFeatures.valence * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tanzbarkeit</span>
                <span>{Math.round(personality.audioFeatures.danceability * 100)}%</span>
              </div>
              <Progress value={personality.audioFeatures.danceability * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Offenheit</span>
                <span>{Math.round(personality.discoveryProfile.openness * 100)}%</span>
              </div>
              <Progress value={personality.discoveryProfile.openness * 100} className="h-2" />
            </div>
          </div>
        </div>

        {/* Top Genres */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Deine Top-Genres
          </h4>
          <div className="flex flex-wrap gap-2">
            {personality.genres.slice(0, 8).map((genre, index) => (
              <Badge key={genre.genre} variant={index < 3 ? "default" : "secondary"}>
                {genre.genre}
              </Badge>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground">Stimmungsprofil</h4>
            <p className="text-sm">{insights.moodDescription}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground">Entdeckungsstil</h4>
            <p className="text-sm">{insights.discoveryStyle}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground">Sozialer Aspekt</h4>
            <p className="text-sm">{insights.socialAspect}</p>
          </div>
        </div>

        {/* Empfehlungen */}
        <div>
          <h4 className="font-semibold mb-2">Empfehlungen für dich</h4>
          <ul className="space-y-1 text-sm">
            {insights.recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-emerald-600">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={analyzePersonality} variant="outline" className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Persönlichkeit aktualisieren
        </Button>
      </CardContent>
    </Card>
  )
}
