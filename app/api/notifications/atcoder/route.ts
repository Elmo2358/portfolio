import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // CORS headers
    const headers = new Headers()
    headers.append('Access-Control-Allow-Origin', '*')
    headers.append('Access-Control-Allow-Methods', 'GET')
    headers.append('Access-Control-Allow-Headers', 'Content-Type')

    // AtCoderコンテストの通知を生成
    const notifications: Array<{
      type: string
      title: string
      message: string
      time: string
      url: string
    }> = []

    // TODO: 実際のコンテストデータを取得
    // 今はモックデータを返す
    const upcomingContests = [
      {
        name: "ABC 345",
        startTime: new Date(Date.now() + 3600000), // 1時間後
        rating: "未参加"
      }
    ]

    // 1時間以内に始まるコンテストを通知
    upcomingContests.forEach(contest => {
      const timeUntilStart = contest.startTime.getTime() - Date.now()
      const hoursUntil = Math.floor(timeUntilStart / (1000 * 60 * 60))

      if (hoursUntil <= 1) {
        notifications.push({
          type: "atcoder",
          title: `🏆 ${contest.name}`,
          message: `${hoursUntil === 0 ? 'もうすぐ' : hoursUntil + '時間後に'}開始します！`,
          time: contest.startTime.toISOString(),
          url: "https://atcoder.jp/contests" // コンテスト一覧ページ
        })
      }
    })

    return NextResponse.json({ notifications }, { headers })
  } catch (error) {
    console.error('Error fetching AtCoder notifications:', error)
    return NextResponse.json({ notifications: [] }, { status: 200 })
  }
}
