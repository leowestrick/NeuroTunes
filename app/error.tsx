"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Fehler in der Konsole protokollieren
    console.error("App error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/20">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Etwas ist schiefgelaufen</h1>
          <p className="mt-2 text-muted-foreground">
            Es ist ein unerwarteter Fehler aufgetreten. Wir arbeiten daran, das Problem zu beheben.
          </p>
          {error.message && (
            <p className="mt-2 max-w-full overflow-hidden text-ellipsis rounded bg-muted px-2 py-1 text-sm">
              {error.message}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Zurück zur Startseite
              </Link>
            </Button>
            <Button onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Erneut versuchen
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
