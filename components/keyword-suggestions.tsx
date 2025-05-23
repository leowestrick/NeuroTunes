"use client"

import { Button } from "@/components/ui/button"

interface KeywordSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void
  disabled?: boolean
}

const SUGGESTIONS = [
  "entspannt",
  "energetisch",
  "konzentriert",
  "glücklich",
  "melancholisch",
  "motivierend",
  "romantisch",
  "Party",
  "Sommer",
  "Workout",
  "Roadtrip",
  "Chill",
  "90er",
  "Indie",
  "Rock",
  "Pop",
  "Hip-Hop",
  "Jazz",
  "Klassik",
  "Electronic",
]

export function KeywordSuggestions({ onSuggestionClick, disabled }: KeywordSuggestionsProps) {
  // Zufällige Auswahl von 8 Vorschlägen
  const randomSuggestions = SUGGESTIONS.sort(() => 0.5 - Math.random()).slice(0, 8)

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-2">Vorschläge:</p>
      <div className="flex flex-wrap gap-2">
        {randomSuggestions.map((suggestion) => (
          <Button
            key={suggestion}
            variant="outline"
            size="sm"
            onClick={() => onSuggestionClick(suggestion)}
            disabled={disabled}
            className="text-xs"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}
