import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * 開発用: すべてのリマインダーを確認
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reminders = await prisma.reminder.findMany({
      where: { userId: session.user.id },
      orderBy: { remindAt: "asc" },
    })

    const now = new Date()

    return NextResponse.json({
      success: true,
      currentTime: now.toISOString(),
      reminders: reminders.map((r) => ({
        id: r.id,
        title: r.title,
        remindAt: r.remindAt,
        isNotified: r.isNotified,
        isDue: r.remindAt <= now,
        timeUntilDue: r.remindAt.getTime() - now.getTime(),
      })),
    })
  } catch (error) {
    console.error("Error checking reminders:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
