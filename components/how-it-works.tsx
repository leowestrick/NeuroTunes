import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Brain, Sparkles, Share2 } from "lucide-react"

export function HowItWorks() {
  return (
    <section className="py-16 px-4 bg-muted/50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Wie NeuroTunes funktioniert</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Unsere KI-Technologie analysiert deine Keywords und findet die perfekten Songs, die zu deiner Stimmung
            passen
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <div className="mb-2 w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Music className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>1. Gib Keywords ein</CardTitle>
              <CardDescription>Beschreibe deine Stimmung oder den gewünschten Musikstil mit Keywords</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Egal ob "entspannt", "Party" oder "Roadtrip" - deine Keywords helfen uns, deine musikalischen Wünsche zu
                verstehen.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Brain className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>2. KI-Analyse</CardTitle>
              <CardDescription>Unsere KI analysiert deine Keywords und findet passende Songs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Die fortschrittliche KI versteht die Stimmung und musikalischen Eigenschaften, die zu deinen Keywords
                passen.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>3. Playlist-Erstellung</CardTitle>
              <CardDescription>Eine personalisierte Playlist wird für dich erstellt</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aus Millionen von Songs wählt NeuroTunes die perfekte Kombination für deine einzigartige Playlist aus.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Share2 className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>4. Genießen & Teilen</CardTitle>
              <CardDescription>Höre deine Playlist und teile sie mit Freunden</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Spiele deine Playlist direkt ab, speichere sie in deiner Bibliothek oder teile sie mit deinen Freunden.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
