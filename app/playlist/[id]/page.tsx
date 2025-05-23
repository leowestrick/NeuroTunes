import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getPlaylistById } from "@/lib/spotify"
import { PlaylistHeader } from "@/components/playlist-header"
import { PlaylistTracks } from "@/components/playlist-tracks"
import { PlaylistActions } from "@/components/playlist-actions"
import { RelatedKeywords } from "@/components/related-keywords"

interface PlaylistPageProps {
  params: {
    id: string
  }
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const playlist = await getPlaylistById(params.id).catch(() => null)

  if (!playlist) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <PlaylistHeader playlist={playlist} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
        <div className="lg:col-span-3">
          <Suspense fallback={<div className="h-[400px] flex items-center justify-center">Lade Tracks...</div>}>
            <PlaylistTracks playlistId={params.id} />
          </Suspense>
        </div>
        <div className="space-y-6">
          <PlaylistActions playlistId={params.id} />
          <RelatedKeywords keywords={playlist.keywords} />
        </div>
      </div>
    </div>
  )
}
