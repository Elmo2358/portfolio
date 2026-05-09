import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * デバッグ用: 現在のデータを確認
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "all"

    let data: any = { user: session.user.id, type }

    if (type === "all" || type === "jobhunt") {
      const jobApps = await prisma.jobApplication.findMany({
        where: { userId: session.user.id },
        orderBy: { appliedDate: "desc" },
      })
      data.jobApplications = jobApps.map((app) => ({
        id: app.id,
        company: app.company,
        position: app.position,
        notes: app.notes,
      }))
    }

    if (type === "all" || type === "tasks") {
      const tasks = await prisma.task.findMany({
        where: { userId: session.user.id },
        take: 5,
      })
      data.tasks = tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
      }))
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error in debug check:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Debug check failed" },
      { status: 500 }
    )
  }
}
