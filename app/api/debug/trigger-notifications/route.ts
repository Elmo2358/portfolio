import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPendingReminders, markReminderAsNotified } from "@/lib/reminders"
import { prisma } from "@/lib/prisma"

/**
 * 開発用: 手動で通知をトリガーするAPI
 * 本番環境ではCronジョブが自動実行されます
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 通知対象のリマインダーを取得（事前通知を含む）
    const pendingReminders = await getPendingReminders()
    const userReminders = pendingReminders.filter((r) => r.userId === session.user.id)

    if (userReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "通知対象のリマインダーはありません",
        pendingReminders: [],
      })
    }

    // 通知を送信
    for (const reminder of userReminders) {
      const now = new Date()
      const reminderTime = new Date(reminder.remindAt)
      const timeDiff = reminderTime.getTime() - now.getTime()
      const oneHour = 60 * 60 * 1000
      const oneDay = 24 * oneHour

      // 通知タイプを判定
      let notificationType = "reminder"
      let notificationTitle = reminder.title
      let notificationMessage = reminder.description || ""

      if (timeDiff > oneDay - oneHour && timeDiff <= oneDay) {
        // 24時間前の通知
        notificationType = "reminder_24h"
        notificationTitle = `【24時間前】${reminder.title}`
        notificationMessage = `24時間後のリマインダー: ${reminder.description || reminder.title}`
      } else if (timeDiff > oneHour - oneHour && timeDiff <= oneHour) {
        // 1時間前の通知
        notificationType = "reminder_1h"
        notificationTitle = `【1時間前】${reminder.title}`
        notificationMessage = `1時間後のリマインダー: ${reminder.description || reminder.title}`
      }

      await prisma.notificationLog.create({
        data: {
          userId: reminder.userId,
          reminderId: reminder.id,
          type: notificationType,
          title: notificationTitle,
          message: `🔔 ${notificationMessage}\n\n通知時刻: ${reminder.remindAt.toLocaleString("ja-JP")}`,
          method: reminder.notifyMethod,
          status: "sent",
        },
      })

      // メインの通知時刻の場合のみ、通知済みフラグをセット
      if (timeDiff <= 0) {
        await markReminderAsNotified(reminder.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${userReminders.length}件の通知を送信しました`,
      pendingReminders: userReminders,
    })
  } catch (error) {
    console.error("Error in debug trigger:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
