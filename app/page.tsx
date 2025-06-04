import { Suspense } from "react"
import { LandingHero } from "@/components/landing-hero"
import { PlaylistGenerator } from "@/components/playlist-generator"
import { HowItWorks } from "@/components/how-it-works"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <>
      {/* Wrap PlaylistGenerator inside Suspense */}
      <Suspense fallback={<div className="h-[400px] flex items-center justify-center">Lade...</div>}>
        <LandingHero />
        <PlaylistGenerator />
      </Suspense>

      {/* Wrap HowItWorks inside Suspense if it needs async rendering */}
      <Suspense fallback={<div className="h-[400px] flex items-center justify-center">Lade...</div>}>
        <HowItWorks />
      </Suspense>

      <Footer />
    </>
  )
}
