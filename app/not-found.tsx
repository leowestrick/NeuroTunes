import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Home } from "lucide-react"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
            <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Seite nicht gefunden</h1>
          <p className="mt-2 text-muted-foreground">
            Die von dir gesuchte Seite existiert nicht oder wurde verschoben.
          </p>

          <div className="mt-6">
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Zurück zur Startseite
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
