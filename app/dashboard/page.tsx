import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { SavedPlaylists } from "@/components/saved-playlists"
import { RecentActivity } from "@/components/recent-activity"
import { UserPreferences } from "@/components/user-preferences"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <DashboardHeader />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="md:col-span-2">
          <SavedPlaylists />
          <RecentActivity className="mt-6" />
        </div>
        <div>
          <UserPreferences />
        </div>
      </div>
    </div>
  )
}
