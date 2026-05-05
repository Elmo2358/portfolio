import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { addEventToCalendar, createContestEvent } from "@/lib/google-calendar"

// POST: コンテストをGoogleカレンダーに追加
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { contestId, event, resource, start, end, href } = body

    if (!contestId || !event || !start) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 環境変数からGoogleアクセストークンを取得
    // Note: 本番環境ではOAuth 2.0フローで取得する必要があります
    const accessToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json({
        error: "Google Calendar access token not configured",
        setupRequired: true,
        setupInstructions: [
          "1. Google Cloud Consoleでプロジェクトを作成",
          "2. Google Calendar APIを有効化",
          "3. OAuth 2.0 クライアントIDを作成",
          "4. アクセストークンを取得して環境変数に設定",
        ],
      }, { status: 501 })
    }

    // カレンダーイベントを作成
    const calendarEvent = createContestEvent({ event, resource, start, end, href })

    // Google Calendarに追加
    const result = await addEventToCalendar(accessToken, calendarEvent)

    return NextResponse.json({
      success: true,
      eventId: result.id,
      htmlLink: result.htmlLink,
      message: "カレンダーに追加しました",
    })
  } catch (error) {
    console.error("Error adding to calendar:", error)

    // 認証エラーの場合は設定案内を返す
    if (error instanceof Error && error.message.includes("401")) {
      return NextResponse.json({
        error: "Google Calendar authentication failed",
        setupRequired: true,
      }, { status: 401 })
    }

    return NextResponse.json(
      { error: "Failed to add to calendar" },
      { status: 500 }
    )
  }
}
