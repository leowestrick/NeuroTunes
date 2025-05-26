"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { createContext, useContext, useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface SpotifyContextType {
  isAuthenticated: boolean
  accessToken: string | null
  user: any | null
  isLoading: boolean
  error: string | null
}

export const SpotifyContext = createContext<SpotifyContextType>({
  isAuthenticated: false,
  accessToken: null,
  user: null,
  isLoading: true,
  error: null,
})

export function SpotifyProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
      <SpotifyProviderInner>{children}</SpotifyProviderInner>
    </SessionProvider>
  )
}

function SpotifyProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.accessToken && !session.error) {
      fetchUserProfile(session.accessToken)
    } else if (session?.error) {
      setError(session.error)
    }
  }, [session])

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
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Fehler beim Abrufen des Benutzerprofils:", error)
      setError(error instanceof Error ? error.message : "Unbekannter Fehler")
    }
  }

  const value = {
    isAuthenticated: !!session?.accessToken && !session.error,
    accessToken: (session?.accessToken as string) || null,
    user,
    isLoading: status === "loading",
    error,
  }

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>
}

export const useSpotify = () => useContext(SpotifyContext)
