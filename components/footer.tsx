import Link from "next/link"
import { Music } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-background border-t py-8 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Music className="h-6 w-6 text-emerald-600" />
              <span className="text-xl font-bold">NeuroTunes</span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Entdecke Musik mit der Kraft der KI. Personalisierte Playlists basierend auf deinen Keywords.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-3">Produkt</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
                  Preise
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-3">Rechtliches</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Nutzungsbedingungen
                </Link>
              </li>
              <li>
                <Link href="/imprint" className="text-muted-foreground hover:text-foreground">
                  Impressum
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-3">Kontakt</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  Kontaktformular
                </Link>
              </li>
              <li>
                <a href="mailto:info@neurotunes.com" className="text-muted-foreground hover:text-foreground">
                  info@neurotunes.com
                </a>
              </li>
              <li>
                <Link href="/support" className="text-muted-foreground hover:text-foreground">
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} NeuroTunes. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  )
}
