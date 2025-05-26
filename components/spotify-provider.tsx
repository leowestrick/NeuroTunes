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
    <SessionProvider>
      <SpotifyProviderInner>{children}</SpotifyProviderInner>
    </SessionProvider>
  )
}

function SpotifyProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.accessToken) {
      fetchUserProfile(session.accessToken)
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
        console.warn("Fehler beim Abrufen des Benutzerprofils:", response.status)
      }
    } catch (error) {
      console.error("Fehler beim Abrufen des Benutzerprofils:", error)
      setError("Fehler beim Laden des Benutzerprofils")
    }
  }

  const value = {
    isAuthenticated: !!session?.accessToken,
    accessToken: (session?.accessToken as string) || null,
    user,
    isLoading: status === "loading",
    error,
  }

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>
}

export const useSpotify = () => useContext(SpotifyContext)
