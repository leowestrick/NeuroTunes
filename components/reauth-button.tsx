"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { signOut } from "next-auth/react"
import { toast } from "@/hooks/use-toast"

interface ReauthButtonProps {
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
}

export function ReauthButton({ variant = "default", size = "default", className = "", children }: ReauthButtonProps) {
  const handleReauth = async () => {
    toast({
      title: "Neu-Authentifizierung",
      description: "Du wirst abgemeldet und zur Spotify-Anmeldung weitergeleitet.",
    })

    // Kurze Verzögerung für die Toast-Anzeige
    setTimeout(async () => {
      // Abmelden und zur Login-Seite mit force-Reauth Parameter
      await signOut({ redirect: false })

      // Kurze Verzögerung für das Abmelden
      setTimeout(() => {
        window.location.href = "/login?reauth=true"
      }, 500)
    }, 1000)
  }

  return (
    <Button variant={variant} size={size} onClick={handleReauth} className={className}>
      <RefreshCw className="mr-2 h-4 w-4" />
      {children || "Spotify-Berechtigungen erneuern"}
    </Button>
  )
}
