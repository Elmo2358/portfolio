import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createReminder, getUserReminders } from "@/lib/reminders"
import { addEventToCalendar, createGenericEvent, updateCalendarEvent } from "@/lib/google-calendar"

// GET: ユーザーのリマインダー一覧を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const targetEntityType = searchParams.get("targetEntityType") || undefined

    const reminders = await getUserReminders(session.user.id, targetEntityType)

    return NextResponse.json({
      success: true,
      reminders,
    })
  } catch (error) {
    console.error("Error fetching reminders:", error)
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    )
  }
}

// POST: 新しいリマインダーを作成（必要に応じてカレンダーにも追加）
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      targetEntityType,
      targetEntityId,
      title,
      description,
      remindAt,
      notifyMethod = "app",
      addToCalendar = false,
      startTime,
      endTime,
      location,
      url,
      reminder24h,
      reminder1h,
      reminderCustom,
    } = body

    if (!targetEntityType || !targetEntityId || !title || !remindAt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // リマインダーを作成
    const reminder = await createReminder({
      userId: session.user.id,
      targetEntityType,
      targetEntityId,
      title,
      description,
      remindAt: new Date(remindAt),
      notifyMethod,
      reminder24h,
      reminder1h,
      reminderCustom,
    })

    // カレンダーにも追加する場合
    let calendarEvent = null
    if (addToCalendar) {
      const accessToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN

      if (!accessToken) {
        return NextResponse.json({
          error: "Google Calendar access token not configured",
          setupRequired: true,
          reminder,
        }, { status: 501 })
      }

      try {
        const event = createGenericEvent({
          title,
          description,
          startTime: new Date(startTime || remindAt),
          endTime: endTime ? new Date(endTime) : undefined,
          location,
          url,
        })

        const result = await addEventToCalendar(accessToken, event)

        // カレンダーイベントIDを紐付け
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { calendarEventId: result.id },
        })

        calendarEvent = {
          id: result.id,
          htmlLink: result.htmlLink,
        }
      } catch (error) {
        console.error("Error adding to calendar:", error)
        // カレンダー追加に失敗してもリマインダーは作成済みとして返す
      }
    }

    return NextResponse.json({
      success: true,
      reminder: {
        ...reminder,
        calendarEvent,
      },
    })
  } catch (error) {
    console.error("Error creating reminder:", error)
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    )
  }
}

// PUT: リマインダーを更新
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "Reminder ID is required" },
        { status: 400 }
      )
    }

    const reminder = await prisma.reminder.update({
      where: { id, userId: session.user.id },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.remindAt && { remindAt: new Date(updates.remindAt) }),
        ...(updates.notifyMethod && { notifyMethod: updates.notifyMethod }),
        ...(updates.reminder24h !== undefined && { reminder24h: updates.reminder24h }),
        ...(updates.reminder1h !== undefined && { reminder1h: updates.reminder1h }),
        ...(updates.reminderCustom !== undefined && { reminderCustom: updates.reminderCustom }),
        // 更新時は通知フラグをリセット
        ...(updates.remindAt && { isNotified: false, notifiedAt: null }),
      },
    })

    // カレンダーイベントも更新する場合
    if (updates.updateCalendar && reminder.calendarEventId) {
      const accessToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN

      if (accessToken) {
        try {
          const event = createGenericEvent({
            title: reminder.title,
            description: reminder.description || undefined,
            startTime: new Date(updates.remindAt || reminder.remindAt),
            endTime: updates.endTime ? new Date(updates.endTime) : undefined,
            location: updates.location,
            url: updates.url,
          })

          await updateCalendarEvent(accessToken, reminder.calendarEventId, event)
        } catch (error) {
          console.error("Error updating calendar event:", error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      reminder,
    })
  } catch (error) {
    console.error("Error updating reminder:", error)
    return NextResponse.json(
      { error: "Failed to update reminder" },
      { status: 500 }
    )
  }
}

// DELETE: リマインダーを削除
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Reminder ID is required" },
        { status: 400 }
      )
    }

    // リマインダーを取得（カレンダーイベントIDを確認）
    const reminder = await prisma.reminder.findUnique({
      where: { id, userId: session.user.id },
    })

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      )
    }

    // カレンダーからも削除
    if (reminder.calendarEventId) {
      const accessToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN

      if (accessToken) {
        try {
          const { deleteCalendarEvent } = await import("@/lib/google-calendar")
          await deleteCalendarEvent(accessToken, reminder.calendarEventId)
        } catch (error) {
          console.error("Error deleting calendar event:", error)
          // カレンダー削除に失敗してもリマインダーは削除する
        }
      }
    }

    // リマインダーを削除
    await prisma.reminder.delete({
      where: { id, userId: session.user.id },
    })

    return NextResponse.json({
      success: true,
      message: "リマインダーを削除しました",
    })
  } catch (error) {
    console.error("Error deleting reminder:", error)
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    )
  }
}
