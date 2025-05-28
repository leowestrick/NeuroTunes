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
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        console.log("JWT: Initial sign in", { userId: user.id, accountProvider: account.provider })
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
        }
      }

      // Return previous token if the access token has not expired yet
      const now = Math.floor(Date.now() / 1000)
      const tokenExpiresAt = token.expiresAt as number

      if (tokenExpiresAt && now < tokenExpiresAt - 300) {
        // 5 minutes buffer
        console.log("JWT: Token still valid")
        return token
      }

      // Access token has expired, try to update it
      console.log("JWT: Token expired, refreshing...")
      return await refreshAccessToken(token)
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
        session.expiresAt = token.expiresAt as number
        session.error = token.error as string
        session.user = {
          ...session.user,
          id: token.user?.id as string,
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

async function refreshAccessToken(token: any) {
  try {
    const url = "https://accounts.spotify.com/api/token"

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
        ).toString("base64")}`,
      },
      method: "POST",
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      console.error("Token refresh failed:", refreshedTokens)
      throw refreshedTokens
    }

    console.log("JWT: Token refreshed successfully")
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    }
  } catch (error) {
    console.error("Error refreshing access token:", error)
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
