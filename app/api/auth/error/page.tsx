"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home } from "lucide-react"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Authentifizierungsfehler</h1>
        <p className="text-muted-foreground mb-4">Bei der Anmeldung ist ein Fehler aufgetreten.</p>
        {error && <p className="text-sm text-red-600 mb-4">Fehlercode: {error}</p>}
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Zurück zur Startseite
          </Link>
        </Button>
      </div>
    </div>
  )
}
