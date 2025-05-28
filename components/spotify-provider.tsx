"use client"

import type React from "react"
import { SessionProvider } from "next-auth/react"
import { createContext, useContext, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "@/hooks/use-toast"

interface SpotifyContextType {
  isAuthenticated: boolean
  accessToken: string | null
  user: any | null
  isLoading: boolean
  error: string | null
  retryAuth: () => void
}

export const SpotifyContext = createContext<SpotifyContextType>({
  isAuthenticated: false,
  accessToken: null,
  user: null,
  isLoading: true,
  error: null,
  retryAuth: () => {},
})

export function SpotifyProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // 5 Minuten
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      <SpotifyProviderInner>{children}</SpotifyProviderInner>
    </SessionProvider>
  )
}

function SpotifyProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession()
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (session?.accessToken && !session.error) {
      fetchUserProfile(session.accessToken)
    } else if (session?.error) {
      handleSessionError(session.error)
    }
  }, [session])

  const handleSessionError = (sessionError: string) => {
    console.error("Session Error:", sessionError)

    switch (sessionError) {
      case "RefreshTokenError":
        setError("Deine Spotify-Session ist abgelaufen. Bitte melde dich erneut an.")
        toast({
          title: "Session abgelaufen",
          description: "Deine Spotify-Verbindung ist abgelaufen. Bitte melde dich erneut an.",
          variant: "destructive",
        })
        break
      case "NoRefreshToken":
        setError("Authentifizierungsfehler. Bitte melde dich erneut an.")
        break
      default:
        setError(`Authentifizierungsfehler: ${sessionError}`)
    }
  }

  const fetchUserProfile = async (token: string) => {
    try {
      setError(null)
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setRetryCount(0) // Reset retry count on success
      } else if (response.status === 401) {
        // Token ist ungültig, versuche Session zu aktualisieren
        console.log("Token ungültig, aktualisiere Session...")
        await update()
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Fehler beim Abrufen des Benutzerprofils:", error)
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"

      if (retryCount < 2) {
        // Automatischer Retry
        console.log(`Retry ${retryCount + 1}/2 für Benutzerprofil...`)
        setRetryCount(retryCount + 1)
        setTimeout(() => fetchUserProfile(token), 2000)
      } else {
        setError(errorMessage)
        setRetryCount(0)
      }
    }
  }

  const retryAuth = async () => {
    setError(null)
    setRetryCount(0)
    await update()
  }

  const value = {
    isAuthenticated: !!session?.accessToken && !session.error && !!user,
    accessToken: (session?.accessToken as string) || null,
    user,
    isLoading: status === "loading",
    error,
    retryAuth,
  }

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>
}

export const useSpotify = () => useContext(SpotifyContext)
