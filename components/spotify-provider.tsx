"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { createContext, useContext } from "react"
import { useSession } from "next-auth/react"

interface SpotifyContextType {
  isAuthenticated: boolean
  accessToken: string | null
  user: any | null
  isLoading: boolean
}

const SpotifyContext = createContext<SpotifyContextType>({
  isAuthenticated: false,
  accessToken: null,
  user: null,
  isLoading: true,
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

  const value = {
    isAuthenticated: !!session?.accessToken,
    accessToken: (session?.accessToken as string) || null,
    user: session?.user || null,
    isLoading: status === "loading",
  }

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>
}

export const useSpotify = () => useContext(SpotifyContext)
