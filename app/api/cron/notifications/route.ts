import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPendingReminders, markReminderAsNotified } from "@/lib/reminders"
import { prisma } from "@/lib/prisma"

/**
 * カスタム時間オフセットを日本語タイトルに変換
 */
function formatCustomTimeTitle(offset: string, baseTitle: string): string {
  const match = offset.match(/^(\d+)([mhdw])$/)
  if (!match) return `【リマインダー】${baseTitle}`

  const value = parseInt(match[1], 10)
  const unit = match[2]

  let unitText = ""
  switch (unit) {
    case "m": unitText = value === 1 ? "1分" : `${value}分`; break
    case "h": unitText = value === 1 ? "1時間" : `${value}時間`; break
    case "d": unitText = value === 1 ? "1日" : `${value}日`; break
    case "w": unitText = value === 1 ? "1週間" : `${value}週間`; break
  }

  return `【${unitText}前】${baseTitle}`
}

/**
 * 通知送信Cronジョブ
 * 15分ごとに実行され、通知時刻が来たリマインダーを送信
 */
export async function POST(req: NextRequest) {
  try {
    // Cronシークレットの検証
    const authHeader = req.headers.get("authorization")
    const cronSecret = req.headers.get("x-cron-secret") || authHeader?.split(" ")[1]

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 通知対象のリマインダーを取得（メイン + 事前通知）
    const pendingReminders = await getPendingReminders()

    if (pendingReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending reminders",
        stats: {
          processed: 0,
          notified: 0,
          failed: 0,
        },
      })
    }

    let notifiedCount = 0
    let failedCount = 0

    // 各リマインダーに対して通知を送信
    for (const reminder of pendingReminders) {
      try {
        const now = new Date()
        const reminderTime = new Date(reminder.remindAt)
        const timeDiff = reminderTime.getTime() - now.getTime()
        const oneHour = 60 * 60 * 1000
        const oneDay = 24 * oneHour

        // 通知タイプを判定
        let notificationType = "reminder"
        let notificationTitle = reminder.title
        let notificationMessage = reminder.description || ""

        // カスタム通知オフセットがある場合
        const customOffset = (reminder as any)._customTimeOffset
        if (customOffset) {
          notificationType = `reminder_custom_${customOffset}`
          notificationTitle = formatCustomTimeTitle(customOffset, reminder.title)
          const offsetText = formatCustomTimeTitle(customOffset, "").replace("【", "").replace("】", "")
          notificationMessage = `${offsetText}後のリマインダー: ${reminder.description || reminder.title}`
        } else if (timeDiff > oneDay - oneHour && timeDiff <= oneDay) {
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

        // 通知ログを作成
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

        notifiedCount++
      } catch (error) {
        console.error(`Error sending reminder ${reminder.id}:`, error)
        failedCount++

        // 失敗ログを記録
        try {
          await prisma.notificationLog.create({
            data: {
              userId: reminder.userId,
              reminderId: reminder.id,
              type: "reminder",
              title: reminder.title,
              message: `通知の送信に失敗しました`,
              method: reminder.notifyMethod,
              status: "failed",
            },
          })
        } catch (logError) {
          console.error("Error creating failure log:", logError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingReminders.length} reminders`,
      stats: {
        processed: pendingReminders.length,
        notified: notifiedCount,
        failed: failedCount,
      },
    })
  } catch (error) {
    console.error("Error in notification cron job:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET: 通知ログを取得（デバッグ用）
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")

    const logs = await prisma.notificationLog.findMany({
      where: { userId: session.user.id },
      orderBy: { sentAt: "desc" },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      logs,
    })
  } catch (error) {
    console.error("Error fetching notification logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    )
  }
}
