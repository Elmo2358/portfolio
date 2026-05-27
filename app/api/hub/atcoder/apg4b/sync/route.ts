import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAllApg4bData } from "@/lib/data/apg4b-data"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 静的データから取得
    const { chapters, lessons } = getAllApg4bData()

    const results = {
      chaptersCreated: 0,
      chaptersUpdated: 0,
      lessonsCreated: 0,
      lessonsUpdated: 0,
    }

    // 章データの保存
    for (const chapter of chapters) {
      const existing = await prisma.apg4bChapter.findUnique({
        where: { chapterId: chapter.chapterId },
      })

      if (existing) {
        await prisma.apg4bChapter.update({
          where: { chapterId: chapter.chapterId },
          data: {
            title: chapter.title,
            section: chapter.section,
            order: chapter.order,
            problemId: chapter.problemId,
            description: chapter.description,
          },
        })
        results.chaptersUpdated++
      } else {
        await prisma.apg4bChapter.create({
          data: {
            chapterId: chapter.chapterId,
            title: chapter.title,
            section: chapter.section,
            order: chapter.order,
            problemId: chapter.problemId,
            description: chapter.description,
          },
        })
        results.chaptersCreated++
      }
    }

    // レッスン（練習問題）データの保存
    for (const lesson of lessons) {
      // 章を検索（データベース内のIDで紐付け）
      const chapter = await prisma.apg4bChapter.findUnique({
        where: { chapterId: lesson.chapterId },
      })

      if (chapter) {
        const existing = await prisma.apg4bLesson.findUnique({
          where: { problemId: lesson.problemId },
        })

        if (existing) {
          await prisma.apg4bLesson.update({
            where: { id: existing.id },
            data: {
              title: lesson.title,
              order: lesson.order,
            },
          })
          results.lessonsUpdated++
        } else {
          await prisma.apg4bLesson.create({
            data: {
              chapterId: chapter.id,
              lessonId: lesson.lessonId,
              title: lesson.title,
              problemId: lesson.problemId,
              order: lesson.order,
            },
          })
          results.lessonsCreated++
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalChapters: chapters.length,
      totalLessons: lessons.length,
    })
  } catch (error) {
    console.error("APG4b sync error:", error)
    return NextResponse.json(
      { error: "Sync failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// GET: 同期ステータスを取得
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const chapterCount = await prisma.apg4bChapter.count()
    const lessonCount = await prisma.apg4bLesson.count()

    return NextResponse.json({
      synced: chapterCount > 0 || lessonCount > 0,
      chapterCount,
      lessonCount,
      totalChapters: getAllApg4bData().chapters.length,
      totalLessons: getAllApg4bData().lessons.length,
    })
  } catch (error) {
    console.error("APG4b status error:", error)
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 })
  }
}
