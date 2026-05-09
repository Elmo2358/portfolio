import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // CORS headers
    const headers = new Headers()
    headers.append('Access-Control-Allow-Origin', '*')
    headers.append('Access-Control-Allow-Methods', 'GET')
    headers.append('Access-Control-Allow-Headers', 'Content-Type')

    // 期限が近いタスクを取得（24時間以内）
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const tasks = await prisma.task.findMany({
      where: {
        status: { in: ['todo', 'in_progress'] },
        dueDate: {
          gte: now,
          lte: tomorrow
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 5
    })

    const notifications = tasks.map(task => {
      const hoursUntil = Math.floor((task.dueDate!.getTime() - Date.now()) / (1000 * 60 * 60))

      return {
        type: 'task',
        title: '📋 タスクリマインダー',
        message: `"${task.title}" の期限が${hoursUntil}時間後です`,
        taskId: task.id,
        time: task.dueDate!.toISOString()
      }
    })

    return NextResponse.json({ notifications }, { headers })
  } catch (error) {
    console.error('Error fetching task notifications:', error)
    return NextResponse.json({ notifications: [] }, { status: 200 })
  }
}
