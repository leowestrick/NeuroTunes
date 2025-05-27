import type React from "react"
import { Inter } from "next/font/google"
import { SpotifyProvider } from "@/components/spotify-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "NeuroTunes - KI-gestützte Playlist-Generator",
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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SpotifyProvider>
            {children}
            <Toaster />
          </SpotifyProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
