import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    }
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    googleAccountId?: string
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
  }
}
