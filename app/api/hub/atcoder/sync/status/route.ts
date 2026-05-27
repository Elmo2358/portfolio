import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: AtCoder同期状態を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ユーザーのAtCoder IDを取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { atCoderId: true },
    })

    if (!user?.atCoderId) {
      return NextResponse.json({
        hasAtCoderId: false,
        lastSync: null,
        submissionCount: 0,
        apg4bProgress: null,
      })
    }

    // 最新の提出履歴を取得
    const latestSubmission = await prisma.atCoderSubmission.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    // 提出数を取得
    const submissionCount = await prisma.atCoderSubmission.count({
      where: { userId: session.user.id },
    })

    // APG4b進捗を取得
    const apg4bCompletedLessons = await prisma.apg4bUserProgress.count({
      where: {
        userId: session.user.id,
        lessonId: { not: null },
        status: "completed",
      },
    })

    const apg4bTotalLessons = await prisma.apg4bLesson.count()

    return NextResponse.json({
      hasAtCoderId: true,
      atCoderId: user.atCoderId,
      lastSync: latestSubmission?.createdAt || null,
      submissionCount,
      apg4bProgress: {
        completedLessons: apg4bCompletedLessons,
        totalLessons: apg4bTotalLessons,
        progressPercent: apg4bTotalLessons > 0
          ? Math.round((apg4bCompletedLessons / apg4bTotalLessons) * 100)
          : 0,
      },
    })
  } catch (error) {
    console.error("Error getting sync status:", error)
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    )
  }
}
