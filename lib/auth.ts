import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"

export const authOptions: AuthOptions = {
  providers: [
    // 既存のCredentialsProvider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 環境変数から認証情報を取得
        const adminUsername = process.env.ADMIN_USERNAME || "admin"
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123"

        if (credentials?.username === adminUsername && credentials?.password === adminPassword) {
          // データベースからユーザーを取得
          const user = await prisma.user.findUnique({
            where: { email: "admin@portfolio.local" }
          })

          return {
            id: user?.id || "1",
            name: user?.name || "Elmo",
            email: user?.email || "admin@portfolio.local"
          }
        }
        return null
      }
    }),

    // 追加: Googleプロバイダー（Google Tasks用）
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Google Tasks APIに必要なスコープ
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/tasks"
        }
      },
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      console.log("🔵 JWT callback:", { hasUser: !!user, hasAccount: !!account, provider: account?.provider })

      // 初回ログイン時
      if (user) {
        // Google認証の場合、データベースのユーザーIDを取得
        if (account?.provider === "google" && user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          })
          if (dbUser) {
            token.id = dbUser.id
            console.log("🔵 Set token.id from database:", dbUser.id)
          }
        } else {
          token.id = user.id
          console.log("🔵 Set token.id:", user.id)
        }
      }

      // Google連携時のアカウント情報を保存
      if (account?.provider === "google") {
        console.log("🔵 Google account found:", {
          providerAccountId: account.providerAccountId,
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
          expiresAt: account.expires_at,
        })
        token.googleAccountId = account.providerAccountId
        // 重要！ アクセストークンを保存
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      // セッションにGoogleのアクセストークンを含める
      session.accessToken = token.accessToken as string | undefined
      session.refreshToken = token.refreshToken as string | undefined
      session.expiresAt = token.expiresAt as number | undefined
      return session
    },
    async signIn({ user, account, profile }) {
      // Google認証時にアクセストークンをデータベースに保存
      if (account?.provider === "google" && user.email) {
        console.log("🔵 Google認証成功:", { email: user.email, hasAccessToken: !!account.access_token })
        try {
          // トークンの有効期限を計算
          const expiresAt = account.expires_at
            ? new Date(account.expires_at * 1000)
            : new Date(Date.now() + 3600 * 1000) // デフォルト1時間

          console.log("🔵 トークン有効期限:", expiresAt)

          // ユーザーを検索または作成
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          })

          console.log("🔵 既存ユーザー:", !!existingUser)

          if (existingUser) {
            // Google連携情報を更新
            const updated = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                googleAccountId: account.providerAccountId,
                googleAccessToken: account.access_token,
                googleRefreshToken: account.refresh_token,
                googleTokenExpiresAt: expiresAt,
              },
            })
            console.log("🔵 Google連携情報を保存しました:", {
              googleAccountId: updated.googleAccountId,
              hasAccessToken: !!updated.googleAccessToken,
            })
          } else {
            // 新規ユーザーを作成
            const created = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
                googleAccountId: account.providerAccountId,
                googleAccessToken: account.access_token,
                googleRefreshToken: account.refresh_token,
                googleTokenExpiresAt: expiresAt,
              },
            })
            console.log("🔵 新規ユーザーを作成しました:", created.id)
          }
        } catch (error) {
          console.error("❌ Error saving Google auth info:", error)
        }
      }
      return true
    }
  },
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development"
}
