"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSpotify } from "@/hooks/use-spotify"
import { SpotifyLoginButton } from "@/components/spotify-login-button"
import { signOut } from "next-auth/react"
import { Music, Home, User, LogOut, Settings, AlertCircle } from "lucide-react"

export function Header() {
  const pathname = usePathname()
  const { isAuthenticated, user, isLoading, error } = useSpotify()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <img src="/MetaIcon.png" className="h-6 w-6" alt="NeuroTunes Icon" />
            <span className="text-xl font-bold">NeuroTunes</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                pathname === "/" ? "text-foreground" : "text-foreground/60"
              }`}
            >
              Home
            </Link>
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  pathname === "/dashboard" ? "text-foreground" : "text-foreground/60"
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {error && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Verbindungsfehler</span>
            </div>
          )}

          {isLoading ? (
            <Button variant="ghost" size="sm" disabled>
              Lade...
            </Button>
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.images?.[0]?.url || "/placeholder.svg"} alt={user?.display_name} />
                    <AvatarFallback>{user?.display_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user?.display_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer flex w-full">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer flex w-full">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer flex w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Einstellungen</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Abmelden</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SpotifyLoginButton variant="default" size="sm" />
          )}
        </div>
      </div>
    </header>
  )
}
