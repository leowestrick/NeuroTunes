"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, X, Lock, Sparkles, Brain, User, Zap } from "lucide-react"
import { useSpotify } from "@/hooks/use-spotify"
import { KeywordSuggestions } from "@/components/keyword-suggestions"
import { SpotifyLoginButton } from "@/components/spotify-login-button"
import { toast } from "@/hooks/use-toast"
import { useEffect } from 'react';

export function PlaylistGenerator() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useSpotify()
  const [inputValue, setInputValue] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState("")
  const [usePersonalization, setUsePersonalization] = useState(true)
  const [buttonText, setButtonText] = useState('Mit Spotify anmelden');

  useEffect(() => {
    const updateButtonText = () => {
      setButtonText(window.innerWidth < 450 ? 'Anmelden' : 'Mit Spotify anmelden');
    };

    updateButtonText();
    window.addEventListener('resize', updateButtonText);

    return () => window.removeEventListener('resize', updateButtonText);
  }, [])

  const handleAddKeyword = () => {
    if (inputValue.trim() && !keywords.includes(inputValue.trim())) {
      setKeywords([...keywords, inputValue.trim()])
      setInputValue("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (!keywords.includes(suggestion)) {
      setKeywords([...keywords, suggestion])
    }
  }

  const generatePlaylist = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Nicht angemeldet",
        description: "Bitte melde dich mit Spotify an, um eine Playlist zu erstellen.",
        variant: "destructive",
      })
      return
    }

    if (keywords.length === 0) {
      toast({
        title: "Keine Keywords",
        description: "Bitte gib mindestens ein Keyword ein.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      if (usePersonalization) {
        // Personalisierte Playlist-Generierung
        setGenerationStep("Sammle deine Spotify-Hördaten...")
        setGenerationProgress(10)
        await new Promise((resolve) => setTimeout(resolve, 800))

        setGenerationStep("Analysiere deine Musikpersönlichkeit...")
        setGenerationProgress(25)
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setGenerationStep("KI erstellt dein Persönlichkeitsprofil...")
        setGenerationProgress(40)
        await new Promise((resolve) => setTimeout(resolve, 800))

        setGenerationStep("Google Gemini generiert personalisierte Songvorschläge...")
        setGenerationProgress(60)
      } else {
        // Standard Playlist-Generierung
        setGenerationStep("Analysiere Keywords...")
        setGenerationProgress(20)
        await new Promise((resolve) => setTimeout(resolve, 500))

        setGenerationStep("Google Gemini generiert Songvorschläge...")
        setGenerationProgress(50)
      }

      const response = await fetch("/api/generate-playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keywords,
          usePersonalization,
        }),
      })

      setGenerationProgress(80)
      setGenerationStep("Suche Songs in Spotify...")

      const data = await response.json()

      if (!response.ok) {
        // Spezielle Behandlung für Authentifizierungsfehler
        if (response.status === 401) {
          toast({
            title: "Session abgelaufen",
            description: "Deine Spotify-Session ist abgelaufen. Bitte melde dich erneut an.",
            variant: "destructive",
          })
          // Optional: Automatische Weiterleitung zum Login
          // signOut({ callbackUrl: "/" })
          return
        }

        throw new Error(data.error || "Fehler bei der Playlist-Generierung")
      }

      setGenerationProgress(95)
      setGenerationStep(usePersonalization ? "Erstelle personalisierte Playlist..." : "Erstelle Playlist...")

      await new Promise((resolve) => setTimeout(resolve, 500))

      setGenerationProgress(100)
      setGenerationStep("Fertig!")

      const personalityInfo =
        data.playlist.personality && usePersonalization
          ? ` (${data.playlist.personality.topGenres?.slice(0, 2).join(", ")} • ${data.playlist.personality.dominantMood})`
          : ""

      toast({
        title:
          usePersonalization && data.playlist.personalized
            ? "Personalisierte Playlist erstellt!"
            : "Playlist erstellt!",
        description: `${data.playlist.trackCount} Songs wurden zu deiner Playlist hinzugefügt${personalityInfo}.`,
      })

      // Kurze Pause vor der Weiterleitung
      await new Promise((resolve) => setTimeout(resolve, 1000))

      router.push(`/playlist/${data.playlist.id}`)
    } catch (error) {
      console.error("Fehler:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Fehler bei der Playlist-Generierung",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
      setGenerationStep("")
    }
  }

  if (isLoading) {
    return (
      <section id="playlist-generator" className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Lade...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="playlist-generator" className="py-16 px-4 bg-background">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-8 w-8 text-emerald-600" />
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Erstelle deine KI-Playlist</h2>
          <p className="text-muted-foreground">
            Powered by Google Gemini - Gib Keywords ein, die deine Stimmung oder gewünschten Musikstil beschreiben
          </p>
        </div>

        {!isAuthenticated ? (
          <Card className="bg-card rounded-xl shadow-lg border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Lock className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Spotify-Anmeldung erforderlich</CardTitle>
              <CardDescription>
                Um personalisierte Playlists mit KI zu erstellen, musst du dich mit deinem Spotify-Konto anmelden.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <SpotifyLoginButton size="lg" className="bg-[#1DB954] hover:bg-[#1ed760] text-white">
                {buttonText}
              </SpotifyLoginButton>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Persönlichkeits-Info Card */}
            <Card className="bg-[rgb(28,25,23)] ">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 ">
                  <User className="h-5 w-5 text-emerald-600" />
                  Personalisierte KI-Analyse
                </CardTitle>
                <CardDescription className="text-[rgb(161,161,170)]">
                  NeuroTunes analysiert deine Spotify-Hörgewohnheiten, um eine einzigartige Musikpersönlichkeit zu
                  erstellen und perfekt passende Playlists zu generieren.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center gap-2">
                      {usePersonalization ? (
                        <Brain className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Zap className="h-5 w-5 text-blue-600" />
                      )}
                      <div>
                        <Label htmlFor="personalization-mode" className="text-base font-medium">
                          {usePersonalization ? "Personalisierte KI-Analyse" : "Standard-Generierung"}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {usePersonalization
                            ? "Analysiert deine Spotify-Hörgewohnheiten für perfekt passende Songs"
                            : "Schnelle Playlist-Erstellung basierend nur auf deinen Keywords"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Switch
                    id="personalization-mode"
                    checked={usePersonalization}
                    onCheckedChange={setUsePersonalization}
                    disabled={isGenerating}
                  />
                </div>

                {/* Info-Boxen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div
                    className={`p-3 rounded-lg transition-all`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium text-sm">Personalisiert</span>
                    </div>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Analysiert deine Top-Genres & Künstler</li>
                      <li>• Berücksichtigt Audio-Features</li>
                      <li>• Erstellt Stimmungsprofil</li>
                      <li>• Dauert 10-15 Sekunden länger</li>
                    </ul>
                  </div>

                  <div
                    className={`p-3 rounded-lg transition-all`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">Standard</span>
                    </div>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Basiert nur auf Keywords</li>
                      <li>• Schnelle Generierung</li>
                      <li>• Allgemeine Songauswahl</li>
                      <li>• Sofortige Ergebnisse</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Playlist Generator */}
            <div className="bg-card rounded-xl shadow-lg p-6 border">
              {isGenerating && (
                <div className="mb-6 p-4 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    {usePersonalization ? (
                      <Brain className="h-5 w-5 text-emerald-600 animate-pulse" />
                    ) : (
                      <Zap className="h-5 w-5 text-blue-600 animate-pulse" />
                    )}
                    <span className="font-medium text-emerald-800">{generationStep}</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-sm text-emerald-600 mt-2">{generationProgress}% abgeschlossen</p>
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="z.B. entspannt, Sommer, Party..."
                  className="flex-1"
                  disabled={isGenerating}
                />
                <Button onClick={handleAddKeyword} disabled={!inputValue.trim() || isGenerating}>
                  Hinzufügen
                </Button>
              </div>

              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-sm py-1 px-3">
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                        disabled={isGenerating}
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <KeywordSuggestions onSuggestionClick={handleSuggestionClick} disabled={isGenerating} />

              <div className="mt-6">
                <Button
                  onClick={generatePlaylist}
                  disabled={keywords.length === 0 || isGenerating}
                  className="w-full whitespace-break-spaces bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {usePersonalization ? "KI erstellt personalisierte Playlist..." : "KI erstellt Playlist..."}
                    </>
                  ) : (
                    <>
                      {usePersonalization ? <Brain className="mr-2 h-5 w-5" /> : <Zap className="mr-2 h-5 w-5" />}
                      {usePersonalization ? "Personalisierte Playlist generieren" : "Playlist generieren"}
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p className="flex items-center justify-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Powered by Google Gemini AI
                  {usePersonalization && " & Spotify-Persönlichkeitsanalyse"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
