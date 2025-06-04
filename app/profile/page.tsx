import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { ProfileHeader } from "@/components/profile-header"
import { ProfileStats } from "@/components/profile-stats"
import { MusicPersonalityCard } from "@/components/music-personality-card"
import { TopGenresCard } from "@/components/top-genres-card"
import { TopArtistsCard } from "@/components/top-artists-card"
import { TopTracksCard } from "@/components/top-tracks-card"
import { ListeningHistoryCard } from "@/components/listening-history-card"

export default async function ProfilePage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <ProfileHeader />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <MusicPersonalityCard />
            <TopArtistsCard />
            <TopTracksCard />
            <ListeningHistoryCard />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <ProfileStats />
            <TopGenresCard />
          </div>
        </div>
      </div>
    </div>
  )
}
