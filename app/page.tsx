import { Suspense } from "react";
import { LandingHero } from "@/components/landing-hero";
import { PlaylistGenerator } from "@/components/playlist-generator";
import { HowItWorks } from "@/components/how-it-works";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">  
        {/* Wrap PlaylistGenerator inside Suspense */}
        <Suspense fallback={<div className="h-[400px] flex items-center justify-center">Lade...</div>}>
          <LandingHero />
          <PlaylistGenerator />
        </Suspense>

        {/* Wrap HowItWorks inside Suspense if it needs async rendering */}
        <Suspense fallback={<div className="h-[400px] flex items-center justify-center">Lade...</div>}>
          <HowItWorks />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
