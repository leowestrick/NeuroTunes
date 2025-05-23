"use client"

import { useContext } from "react"
import { SpotifyContext } from "@/components/spotify-provider"

export function useSpotify() {
  return useContext(SpotifyContext)
}
