"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export type NotionSettings = {
  isConnected: boolean
  wikiEnabled: boolean
  wikiDatabaseId: string
}

export type NotionSettingsResult = NotionSettings | { error: string }

export async function getNotionSettings(): Promise<NotionSettingsResult> {
  const session = await getServerSession(authOptions)

  console.log("🔍 getNotionSettings - session:", session?.user?.email)

  if (!session?.user?.email) {
    return { isConnected: false, wikiEnabled: false, wikiDatabaseId: "" }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      notionWikiEnabled: true,
      notionWikiDatabaseId: true,
    },
  })

  console.log("🔍 getNotionSettings - user:", user)

  return {
    isConnected: !!user?.notionWikiDatabaseId,
    wikiEnabled: user?.notionWikiEnabled || false,
    wikiDatabaseId: user?.notionWikiDatabaseId || "",
  }
}

export async function saveNotionSettings(formData: FormData) {
  const session = await getServerSession(authOptions)

  console.log("🔍 saveNotionSettings - session email:", session?.user?.email)

  if (!session?.user?.email) {
    console.log("❌ No email in session")
    return { error: "Unauthorized" }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  console.log("🔍 saveNotionSettings - user found:", user ? user.id : "null")

  if (!user) {
    console.log("❌ User not found for email:", session.user.email)
    return { error: "User not found" }
  }

  const accessToken = formData.get("accessToken") as string
  const databaseId = formData.get("databaseId") as string

  if (!accessToken || !databaseId) {
    return { error: "アクセストークンとデータベースIDは必須です" }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      notionAccessToken: accessToken,
      notionWikiEnabled: true,
      notionWikiDatabaseId: databaseId,
    },
  })

  console.log("✅ Notion settings saved for user:", user.id)

  revalidatePath("/hub/settings")
  revalidatePath("/hub/wiki")

  return { success: true, message: "Notion Wiki連携が完了しました！" }
}

export async function toggleNotionWiki(enabled: boolean) {
  const session = await getServerSession(authOptions)

  console.log("🔍 toggleNotionWiki - session email:", session?.user?.email)

  if (!session?.user?.email) {
    return { error: "Unauthorized" }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    console.log("❌ User not found for email:", session.user.email)
    return { error: "User not found" }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      notionWikiEnabled: enabled,
    },
  })

  revalidatePath("/hub/settings")
  revalidatePath("/hub/wiki")

  return { success: true, message: enabled ? "Wikiを有効にしました" : "Wikiを無効にしました" }
}

export async function disconnectNotion() {
  const session = await getServerSession(authOptions)

  console.log("🔍 disconnectNotion - session email:", session?.user?.email)

  if (!session?.user?.email) {
    return { error: "Unauthorized" }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    console.log("❌ User not found for email:", session.user.email)
    return { error: "User not found" }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      notionWikiEnabled: false,
      notionAccessToken: null,
      notionWikiDatabaseId: null,
    },
  })

  revalidatePath("/hub/settings")
  revalidatePath("/hub/wiki")

  return { success: true, message: "Notion連携を解除しました" }
}
