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
    console.log("Session status:", status)
    console.log("Session data:", session)

    if (session?.accessToken && !session.error) {
      fetchUserProfile(session.accessToken)
    } else if (session?.error) {
      console.error("Session error:", session.error)
      setError(session.error)
    }
  }, [session])

  const fetchUserProfile = async (token: string) => {
    try {
      setError(null)
      console.log("Fetching user profile...")

      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        console.log("User profile fetched:", userData.display_name)
        setUser(userData)
      } else {
        console.error("Failed to fetch user profile:", response.status)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
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
