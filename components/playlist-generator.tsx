"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, X, Music, Lock } from "lucide-react"
import { useSpotify } from "@/hooks/use-spotify"
import { KeywordSuggestions } from "@/components/keyword-suggestions"
import { SpotifyLoginButton } from "@/components/spotify-login-button"
import { toast } from "@/hooks/use-toast"

export function PlaylistGenerator() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useSpotify()
  const [inputValue, setInputValue] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

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

    try {
      const response = await fetch("/api/generate-playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keywords }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Fehler bei der Playlist-Generierung")
      }

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
          <h2 className="text-3xl font-bold mb-2">Erstelle deine Playlist</h2>
          <p className="text-muted-foreground">
            Gib Keywords ein, die deine Stimmung oder gewünschten Musikstil beschreiben
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
                Um personalisierte Playlists zu erstellen, musst du dich mit deinem Spotify-Konto anmelden.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <SpotifyLoginButton size="lg" className="bg-[#1DB954] hover:bg-[#1ed760] text-white">
                Mit Spotify anmelden
              </SpotifyLoginButton>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-card rounded-xl shadow-lg p-6 border">
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Playlist wird erstellt...
                  </>
                ) : (
                  <>
                    <Music className="mr-2 h-5 w-5" />
                    Playlist generieren
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
