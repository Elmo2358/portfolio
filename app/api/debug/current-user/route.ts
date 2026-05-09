import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * デバッグ用: 現在のログインユーザー情報を確認
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({
        error: "Not logged in",
        session: null
      }, { status: 401 })
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
      }
    })

    // このユーザーのデータ数を確認
    const [taskCount, jobAppCount, bucketCount] = await Promise.all([
      prisma.task.count({ where: { userId: session.user.id } }),
      prisma.jobApplication.count({ where: { userId: session.user.id } }),
      prisma.bucketListItem.count({ where: { userId: session.user.id } }),
    ])

    return NextResponse.json({
      success: true,
      session: {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      user,
      dataCounts: {
        tasks: taskCount,
        jobApplications: jobAppCount,
        bucketItems: bucketCount,
      }
    })
  } catch (error) {
    console.error("Error in debug check:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Debug check failed" },
      { status: 500 }
    )
  }
}
