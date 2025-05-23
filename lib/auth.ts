import { getServerSession } from "next-auth"

export async function getSession() {
  const session = await getServerSession()
  return session
}

export async function getAccessToken() {
  const session = await getSession()
  return session?.accessToken as string
}

export async function getUserId() {
  const session = await getSession()
  if (!session) return null

  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch user data")
    }

    const userData = await response.json()
    return userData.id
  } catch (error) {
    console.error("Error fetching user ID:", error)
    return null
  }
}
