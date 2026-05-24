import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessions = await prisma.timerSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Failed to fetch timer sessions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, durationMinutes, actualDurationSeconds, category } = body

    if (!durationMinutes || typeof durationMinutes !== "number") {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 })
    }

    const timerSession = await prisma.timerSession.create({
      data: {
        userId: session.user.id,
        title: title || "タイマーセッション",
        durationMinutes,
        category: category || "custom",
        completed: true,
        completedAt: new Date(),
        actualDurationSeconds: actualDurationSeconds ?? durationMinutes * 60
      }
    })

    return NextResponse.json(timerSession, { status: 201 })
  } catch (error) {
    console.error("Failed to create timer session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
