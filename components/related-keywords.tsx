"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface RelatedKeywordsProps {
  keywords: string[]
}

// Beispiel-Mapping für verwandte Keywords
const RELATED_KEYWORDS: Record<string, string[]> = {
  entspannt: ["chill", "ambient", "lofi", "akustisch"],
  energetisch: ["workout", "dance", "edm", "power"],
  Party: ["dance", "club", "electronic", "hits"],
  Sommer: ["beach", "tropical", "sunny", "vacation"],
  Rock: ["alternative", "indie", "classic rock", "punk"],
  Pop: ["charts", "mainstream", "radio hits", "catchy"],
  "Hip-Hop": ["rap", "urban", "beats", "r&b"],
  Jazz: ["blues", "soul", "swing", "instrumental"],
}

export function RelatedKeywords({ keywords }: RelatedKeywordsProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)

  // Sammle verwandte Keywords basierend auf den aktuellen Keywords
  const getRelatedKeywords = () => {
    const related = new Set<string>()

    keywords.forEach((keyword) => {
      const relatedToKeyword = RELATED_KEYWORDS[keyword] || []
      relatedToKeyword.forEach((k) => {
        if (!keywords.includes(k)) {
          related.add(k)
        }
      })
    })

    return Array.from(related).slice(0, 8)
  }

  const relatedKeywords = getRelatedKeywords()

  const generateWithKeyword = async (keyword: string) => {
    setIsGenerating(true)

    try {
      const newKeywords = [...keywords, keyword]

      const response = await fetch("/api/generate-playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keywords: newKeywords }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Fehler bei der Playlist-Generierung")
      }

      router.push(`/playlist/${data.playlist.id}`)
    } catch (error) {
      console.error("Fehler:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verwandte Keywords</CardTitle>
        <CardDescription>Erstelle eine neue Playlist mit zusätzlichen Keywords</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {relatedKeywords.map((keyword) => (
            <Badge
              key={keyword}
              variant="outline"
              className="cursor-pointer hover:bg-muted"
              onClick={() => generateWithKeyword(keyword)}
            >
              {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              {keyword}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
