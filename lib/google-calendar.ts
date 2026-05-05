// Google Calendar API クライアント
// コンテストをGoogleカレンダーに追加

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3"

export interface CalendarEvent {
  summary: string // イベント名
  description?: string // 説明
  start: {
    dateTime: string // ISO 8601形式（例: "2025-01-01T12:00:00+09:00"）
  }
  end: {
    dateTime: string
  }
  location?: string
  colorId?: string // カレンダーの色（1-11）
}

/**
 * Google Calendarにイベントを追加
 * @param accessToken - OAuthアクセストークン
 * @param event - カレンダーイベント
 */
export async function addEventToCalendar(
  accessToken: string,
  event: CalendarEvent
): Promise<{ id: string; htmlLink: string }> {
  try {
    const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Calendar API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return {
      id: data.id,
      htmlLink: data.htmlLink,
    }
  } catch (error) {
    console.error("Error adding event to calendar:", error)
    throw error
  }
}

/**
 * コンテスト情報をカレンダーイベント形式に変換
 */
export function createContestEvent(contest: {
  event: string
  resource: string
  start: string
  end: string
  href: string
}): CalendarEvent {
  return {
    summary: `${contest.event} (${contest.resource})`,
    description: `コンテストページ: ${contest.href}`,
    start: {
      dateTime: contest.start,
    },
    end: {
      dateTime: contest.end,
    },
    location: "Online",
    colorId: "6", // 水色（AtCoderカラー）
  }
}

/**
 * 汎用カレンダーイベントを作成（タスク、就活、バケツリストなど）
 */
export function createGenericEvent(input: {
  title: string
  description?: string
  startTime: Date
  endTime?: Date
  location?: string
  url?: string
  colorId?: string
}): CalendarEvent {
  const endTime = input.endTime || new Date(input.startTime.getTime() + 60 * 60 * 1000)

  return {
    summary: input.title,
    description: input.description + (input.url ? `\n\n${input.url}` : ""),
    start: {
      dateTime: input.startTime.toISOString(),
    },
    end: {
      dateTime: endTime.toISOString(),
    },
    ...(input.location && { location: input.location }),
    ...(input.colorId && { colorId: input.colorId }),
  }
}

/**
 * Google Calendarのイベントを更新
 */
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  event: CalendarEvent
): Promise<{ id: string; htmlLink: string }> {
  try {
    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Calendar API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return {
      id: data.id,
      htmlLink: data.htmlLink,
    }
  } catch (error) {
    console.error("Error updating calendar event:", error)
    throw error
  }
}

/**
 * Google Calendarのイベントを削除
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  try {
    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok && response.status !== 404) {
      // 404は既に削除されている場合なので無視
      const errorText = await response.text()
      throw new Error(`Calendar API error: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    console.error("Error deleting calendar event:", error)
    throw error
  }
}
