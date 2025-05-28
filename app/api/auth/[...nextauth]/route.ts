import NextAuth, { type NextAuthOptions } from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"

const scopes = [
  "user-read-email",
  "user-read-private",
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-library-read",
  "user-library-modify",
  "user-top-read",
  "streaming",
  "user-read-playback-state",
  "user-read-recently-played",
  "user-follow-read",
  "user-read-currently-playing",
].join(" ")

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: scopes,
          show_dialog: "true", // Erzwingt Login-Dialog auch bei bereits angemeldeten Nutzern
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user, trigger }) {
      console.log("JWT Callback:", {
        trigger,
        hasAccount: !!account,
        hasUser: !!user,
        hasToken: !!token,
        tokenError: token.error,
        expiresAt: token.expiresAt,
        currentTime: Math.floor(Date.now() / 1000),
      })

      // Initiales Token mit Account-Informationen
      if (account && user) {
        console.log("Neues Token erstellt für Benutzer:", user.name)
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
          error: undefined, // Reset error
        }
      }

      // Prüfe ob Token noch gültig ist (mit 5 Minuten Puffer)
      const tokenExpiresAt = token.expiresAt as number
      const now = Math.floor(Date.now() / 1000)
      const bufferTime = 5 * 60 // 5 Minuten

      if (tokenExpiresAt && now < tokenExpiresAt - bufferTime) {
        console.log("Token ist noch gültig")
        return token
      }

      console.log("Token ist abgelaufen oder läuft bald ab, versuche zu erneuern...")

      // Token ist abgelaufen, versuche zu erneuern
      if (!token.refreshToken) {
        console.error("Kein Refresh Token verfügbar")
        return {
          ...token,
          error: "NoRefreshToken",
        }
      }

      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
            ).toString("base64")}`,
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error("Token-Refresh fehlgeschlagen:", response.status, errorData)
          throw new Error(`Token refresh failed: ${response.status}`)
        }

        const data = await response.json()
        console.log("Token erfolgreich erneuert")

        return {
          ...token,
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? token.refreshToken, // Behalte alten refresh token falls keiner zurückgegeben wird
          expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
          error: undefined, // Reset error
        }
      } catch (error) {
        console.error("Error refreshing token:", error)
        return {
          ...token,
          error: "RefreshTokenError",
        }
      }
    },
    async session({ session, token }) {
      console.log("Session Callback:", {
        hasSession: !!session,
        hasToken: !!token,
        tokenError: token.error,
        userId: token.user?.id,
      })

      if (token) {
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
        session.expiresAt = token.expiresAt as number
        session.error = token.error as string
        session.user = {
          ...session.user,
          id: token.user?.id as string,
          name: token.user?.name as string,
          email: token.user?.email as string,
          image: token.user?.image as string,
        }
      }

      return session
    },
    async redirect({ url, baseUrl }) {
      console.log("Redirect Callback:", { url, baseUrl })

      // Erlaube Redirects zu relativen URLs oder URLs auf derselben Domain
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url

      // Standard-Redirect nach erfolgreichem Login
      return `${baseUrl}/dashboard`
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Tage
    updateAge: 24 * 60 * 60, // 24 Stunden
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 Tage
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  events: {
    async signIn({ user, account, profile }) {
      console.log("SignIn Event:", {
        userId: user.id,
        userName: user.name,
        accountProvider: account?.provider,
      })
    },
    async signOut({ session, token }) {
      console.log("SignOut Event:", {
        userId: token?.user?.id,
      })
    },
    async session({ session, token }) {
      // Nur bei Debug-Modus loggen
      if (process.env.NODE_ENV === "development") {
        console.log("Session Event:", {
          userId: session.user?.id,
          hasAccessToken: !!session.accessToken,
          error: session.error,
        })
      }
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
