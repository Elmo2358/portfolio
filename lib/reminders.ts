import { prisma } from "./prisma"

export interface ReminderInput {
  userId: string
  targetEntityType: string
  targetEntityId: string
  title: string
  description?: string
  remindAt: Date
  notifyMethod?: "app" | "email" | "both"
  reminder24h?: boolean
  reminder1h?: boolean
  reminderCustom?: string
}

export interface CalendarEventInput {
  title: string
  description?: string
  startTime: Date
  endTime?: Date
  location?: string
  url?: string
}

/**
 * リマインダーを作成
 */
export async function createReminder(input: ReminderInput) {
  return await prisma.reminder.create({
    data: {
      userId: input.userId,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
      title: input.title,
      description: input.description,
      remindAt: input.remindAt,
      notifyMethod: input.notifyMethod || "app",
      reminder24h: input.reminder24h ?? false,
      reminder1h: input.reminder1h ?? false,
      reminderCustom: input.reminderCustom,
    },
  })
}

/**
 * リマインダーを更新
 */
export async function updateReminder(
  id: string,
  userId: string,
  updates: Partial<ReminderInput>
) {
  return await prisma.reminder.update({
    where: { id, userId },
    data: {
      ...(updates.title && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.remindAt && { remindAt: updates.remindAt }),
      ...(updates.notifyMethod && { notifyMethod: updates.notifyMethod }),
    },
  })
}

/**
 * リマインダーを削除
 */
export async function deleteReminder(id: string, userId: string) {
  return await prisma.reminder.delete({
    where: { id, userId },
  })
}

/**
 * ユーザーのリマインダー一覧を取得
 */
export async function getUserReminders(
  userId: string,
  targetEntityType?: string
) {
  const where: any = { userId }

  if (targetEntityType) {
    where.targetEntityType = targetEntityType
  }

  return await prisma.reminder.findMany({
    where,
    orderBy: { remindAt: "asc" },
  })
}

/**
 * カスタム通知時間をパースしてミリ秒に変換
 */
function parseCustomTimeOffset(timeStr: string): number | null {
  const match = timeStr.match(/^(\d+)([mhdw])$/)
  if (!match) return null

  const value = parseInt(match[1], 10)
  const unit = match[2]

  switch (unit) {
    case "m": return value * 60 * 1000
    case "h": return value * 60 * 60 * 1000
    case "d": return value * 24 * 60 * 60 * 1000
    case "w": return value * 7 * 24 * 60 * 60 * 1000
    default: return null
  }
}

/**
 * 通知対象のリマインダーを取得（現在時刻以降で未通知）
 */
export async function getPendingReminders() {
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // メインの通知時刻が来たリマインダー
  const mainReminders = await prisma.reminder.findMany({
    where: {
      isNotified: false,
      remindAt: { lte: now },
    },
    include: {
      userRel: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })

  // 24時間前通知が来たリマインダー
  const reminder24hList = await prisma.reminder.findMany({
    where: {
      reminder24h: true,
      remindAt: { lte: oneDayLater, gt: now },
    },
    include: {
      userRel: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })

  // 1時間前通知が来たリマインダー
  const reminder1hList = await prisma.reminder.findMany({
    where: {
      reminder1h: true,
      remindAt: { lte: oneHourLater, gt: now },
    },
    include: {
      userRel: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })

  // カスタム通知時間があるリマインダーを取得
  const remindersWithCustom = await prisma.reminder.findMany({
    where: {
      reminderCustom: { not: null },
      remindAt: { gt: now },
    },
    include: {
      userRel: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })

  // カスタム通知時間を処理
  const customReminders: typeof remindersWithCustom = []
  for (const reminder of remindersWithCustom) {
    if (!reminder.reminderCustom) continue

    let customTimes: string[]
    try {
      customTimes = JSON.parse(reminder.reminderCustom)
    } catch {
      continue
    }

    const remindAtTime = new Date(reminder.remindAt).getTime()

    for (const timeStr of customTimes) {
      const offset = parseCustomTimeOffset(timeStr)
      if (offset === null) continue

      const notifyTime = remindAtTime - offset
      const notifyTimeDate = new Date(notifyTime)

      // 通知時間が過去（現在以前）で、まだ通知ログにない場合
      if (notifyTimeDate <= now) {
        const logType = `reminder_custom_${timeStr}`
        const existingLog = await prisma.notificationLog.findFirst({
          where: {
            reminderId: reminder.id,
            type: logType,
          },
        })

        if (!existingLog) {
          customReminders.push({ ...reminder, _customTimeOffset: timeStr } as any)
          break // 1回の実行で1つのカスタム通知のみ送信
        }
      }
    }
  }

  // 重複を除いて結合
  const allReminders = [...mainReminders, ...reminder24hList, ...reminder1hList, ...customReminders]
  const uniqueReminders = Array.from(
    new Map(allReminders.map((r) => [r.id, r])).values()
  )

  return uniqueReminders
}

/**
 * リマインダーを通知済みにマーク（メイン通知時のみ）
 */
export async function markReminderAsNotified(id: string) {
  return await prisma.reminder.update({
    where: { id },
    data: {
      isNotified: true,
      notifiedAt: new Date(),
    },
  })
}

/**
 * 事前通知を送信したかどうかをチェック
 * 24時間前または1時間前の通知を送信済みかどうかを返す
 */
export async function checkPreNotificationSent(
  reminderId: string,
  type: "24h" | "1h"
): Promise<boolean> {
  // 通知ログで確認
  const count = await prisma.notificationLog.count({
    where: {
      reminderId,
      type: `reminder_${type}`,
    },
  })

  return count > 0
}

/**
 * カレンダーイベントIDをリマインダーに紐付け
 */
export async function linkCalendarEvent(
  reminderId: string,
  calendarEventId: string
) {
  return await prisma.reminder.update({
    where: { id: reminderId },
    data: { calendarEventId },
  })
}

/**
 * 特定エンティティのリマインダーを取得
 */
export async function getEntityReminders(
  userId: string,
  targetEntityType: string,
  targetEntityId: string
) {
  return await prisma.reminder.findMany({
    where: {
      userId,
      targetEntityType,
      targetEntityId,
    },
    orderBy: { remindAt: "asc" },
  })
}
