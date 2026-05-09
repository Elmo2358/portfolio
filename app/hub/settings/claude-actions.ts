"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function saveClaudeSettings(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return { error: "Unauthorized" }
  }

  const apiKey = formData.get("apiKey") as string
  const enabled = formData.get("enabled") === "true"

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return { error: "User not found" }
  }

  // APIキーが入力されている場合のみ保存
  if (apiKey && apiKey.trim()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        claudeApiKey: apiKey.trim(),
        claudeApiEnabled: enabled,
      },
    })
  } else if (!enabled) {
    // 無効化の場合はAPIキーを保持したままフラグだけ更新
    await prisma.user.update({
      where: { id: user.id },
      data: {
        claudeApiEnabled: false,
      },
    })
  }

  revalidatePath("/hub/settings")
  return { success: true }
}

export async function clearClaudeSettings() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return { error: "Unauthorized" }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return { error: "User not found" }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      claudeApiKey: null,
      claudeApiEnabled: false,
    },
  })

  revalidatePath("/hub/settings")
  return { success: true }
}
