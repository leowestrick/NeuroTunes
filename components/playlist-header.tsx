import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Share2, Clock, Music } from "lucide-react"

interface PlaylistHeaderProps {
  playlist: any
}

export function PlaylistHeader({ playlist }: PlaylistHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-lg shadow-lg">
        {playlist.images?.[0]?.url ? (
          <Image
            src={playlist.images[0].url || "/placeholder.svg"}
            alt={playlist.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-emerald-800 flex items-center justify-center">
            <Music className="h-24 w-24 text-white opacity-50" />
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between py-2">
        <div>
          <p className="text-sm font-medium uppercase text-muted-foreground">Playlist</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl lg:text-5xl">{playlist.name}</h1>

          <p className="mt-4 text-muted-foreground">{playlist.description}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {playlist.keywords?.map((keyword: string) => (
              <Badge key={keyword} variant="outline">
                {keyword}
              </Badge>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{playlist.owner?.display_name}</span>
            <span>•</span>
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              <span>Erstellt am {new Date(playlist.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Play className="mr-2 h-4 w-4" />
            Abspielen
          </Button>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
