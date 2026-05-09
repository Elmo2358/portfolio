import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NotionSettingsForm } from "@/components/hub/notion-settings-form"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // デフォルト値
  let notionSettings = {
    isConnected: false,
    wikiEnabled: false,
    wikiDatabaseId: "",
  }

  // セッションのメールアドレスからユーザーを取得して設定を読み込む
  if (session?.user?.email) {
    try {
      const { prisma } = await import("@/lib/prisma")
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          notionWikiEnabled: true,
          notionWikiDatabaseId: true,
          notionAccessToken: true,
        },
      })

      if (user) {
        notionSettings = {
          isConnected: !!user.notionAccessToken,
          wikiEnabled: user.notionWikiEnabled || false,
          wikiDatabaseId: user.notionWikiDatabaseId || "",
        }
      }
    } catch (error) {
      console.error("Error fetching Notion settings:", error)
    }
  }

  return (
    <div className="container py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-600 dark:bg-emerald-500">
            <span className="text-2xl">⚙️</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              設定
            </h1>
            <p className="text-muted-foreground">Settings</p>
          </div>
        </div>

        {/* Notion Wiki連携 - Server Component + Server Actions */}
        <NotionSettingsForm initialSettings={notionSettings} />

        {/* 他の設定 - Client Component */}
        <SettingsClient />
      </div>
    </div>
  )
}
