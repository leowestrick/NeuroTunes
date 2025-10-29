import type React from "react"
import { Inter } from "next/font/google"
import { SpotifyProvider } from "@/components/spotify-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "NeuroTunes - KI-gestützte Playlist-Generator",
  icons: {
    icon: "/MetaIcon.png",
  },
  description: "Erstelle personalisierte Playlists basierend auf Keywords und Stimmungen",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
    <Analytics/>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SpotifyProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
            <Toaster />
          </SpotifyProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
