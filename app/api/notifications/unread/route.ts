import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // CORS headers
    const headers = new Headers()
    headers.append('Access-Control-Allow-Origin', '*')
    headers.append('Access-Control-Allow-Methods', 'GET')
    headers.append('Access-Control-Allow-Headers', 'Content-Type')

    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    // 期限が近いタスク
    const tasks = await prisma.task.count({
      where: {
        status: { in: ['todo', 'in_progress'] },
        dueDate: {
          gte: now,
          lte: tomorrow
        }
      }
    })

    // 就活の予定
    const jobs = await prisma.jobApplication.count({
      where: {
        status: { in: ['ES提出', 'テスト面接', '最終面接'] },
        appliedDate: {
          gte: now,
          lte: threeDaysLater
        }
      }
    })

    const totalUnread = tasks + jobs

    return NextResponse.json({ count: totalUnread }, { headers })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json({ count: 0 }, { status: 200 })
  }
}
