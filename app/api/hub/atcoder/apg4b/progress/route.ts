import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 全章を取得（章ごとの進捗も含める）
    const chapters = await prisma.apg4bChapter.findMany({
      orderBy: { order: "asc" },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
        userProgress: {
          where: { userId: session.user.id },
        },
      },
    })

    // 各レッスンの進捗を取得
    const lessonsProgress = await prisma.apg4bUserProgress.findMany({
      where: {
        userId: session.user.id,
        lessonId: { not: null },
      },
      include: {
        lesson: {
          include: {
            chapter: true,
          },
        },
      },
    })

    const lessonProgressMap = new Map(
      lessonsProgress.map((p) => [p.lessonId, p])
    )

    // 統計情報を計算
    const totalLessons = chapters.reduce((sum, ch) => sum + ch.lessons.length, 0)
    const completedLessons = lessonsProgress.filter((p) => p.status === "completed").length
    const inProgressLessons = lessonsProgress.filter((p) => p.status === "in_progress").length

    // 章ごとの進捗データを構築
    const chaptersWithProgress = chapters.map((chapter) => {
      const chapterCompletedLessons = chapter.lessons.filter((lesson) => {
        const progress = lessonProgressMap.get(lesson.id)
        return progress?.status === "completed"
      }).length

      return {
        id: chapter.id,
        chapterId: chapter.chapterId,
        title: chapter.title,
        section: chapter.section,
        order: chapter.order,
        problemId: chapter.problemId,
        description: chapter.description,
        url: `https://atcoder.jp/contests/APG4b/tasks/${chapter.problemId}`,
        userProgress: chapter.userProgress[0] || null,
        lessons: chapter.lessons.map((lesson) => ({
          id: lesson.id,
          lessonId: lesson.lessonId,
          title: lesson.title,
          problemId: lesson.problemId,
          order: lesson.order,
          difficulty: lesson.difficulty,
          url: `https://atcoder.jp/contests/APG4b/tasks/${lesson.problemId}`,
          userProgress: lessonProgressMap.get(lesson.id) || null,
        })),
        completedLessons: chapterCompletedLessons,
        totalLessons: chapter.lessons.length,
      }
    })

    return NextResponse.json({
      chapters: chaptersWithProgress,
      stats: {
        totalLessons,
        completedLessons,
        inProgressLessons,
        notStartedLessons: totalLessons - completedLessons - inProgressLessons,
        progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      },
    })
  } catch (error) {
    console.error("APG4b progress error:", error)
    return NextResponse.json(
      { error: "Failed to get progress", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
