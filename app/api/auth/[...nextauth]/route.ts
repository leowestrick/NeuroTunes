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
].join(" ")

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: scopes,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      console.log("JWT Callback:", {
        hasAccount: !!account,
        hasUser: !!user,
        hasToken: !!token,
        tokenKeys: token ? Object.keys(token) : [],
      })

      // Initiales Token mit Account-Informationen
      if (account && user) {
        console.log("Neues Token erstellt")
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          user,
        }
      }

      // Prüfe ob Token noch gültig ist
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        console.log("Token ist noch gültig")
        return token
      }

      console.log("Token ist abgelaufen, versuche zu erneuern...")

      // Token ist abgelaufen, versuche zu erneuern
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

        const data = await response.json()

        if (!response.ok) {
          console.error("Token-Refresh fehlgeschlagen:", data)
          throw new Error("Failed to refresh token")
        }

        console.log("Token erfolgreich erneuert")

        return {
          ...token,
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? token.refreshToken,
          expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
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
      })

      if (token) {
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
        session.expiresAt = token.expiresAt as number
        session.error = token.error as string
        session.user = token.user as any
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/api/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Tage
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
