import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // CORS headers
    const headers = new Headers()
    headers.append('Access-Control-Allow-Origin', '*')
    headers.append('Access-Control-Allow-Methods', 'GET')
    headers.append('Access-Control-Allow-Headers', 'Content-Type')

    // 今後3日以内の予定を取得
    const now = new Date()
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    const applications = await prisma.jobApplication.findMany({
      where: {
        status: { in: ['ES提出', 'テスト面接', '最終面接'] },
        appliedDate: {
          gte: now,
          lte: threeDaysLater
        }
      },
      orderBy: { appliedDate: 'asc' },
      take: 5
    })

    const notifications = applications.map(app => {
      const daysUntil = Math.floor((app.appliedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

      return {
        type: 'job',
        title: '💼 就活リマインダー',
        message: `${app.company}の${app.status}が${daysUntil}日後です`,
        applicationId: app.id,
        time: app.appliedDate.toISOString()
      }
    })

    return NextResponse.json({ notifications }, { headers })
  } catch (error) {
    console.error('Error fetching job notifications:', error)
    return NextResponse.json({ notifications: [] }, { status: 200 })
  }
}
