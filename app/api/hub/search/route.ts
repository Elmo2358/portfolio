import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * 全アプリ横断検索
 * GET /api/hub/search?q={query}&app={all|tasks|jobhunt|bucket|atcoder}
 *
 * 注意: SQLiteはcase-insensitive searchをサポートしていないため、
 * アプリケーション側でフィルタリングを行っています。
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") || ""
    const app = searchParams.get("app") || "all"

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        query,
        results: [],
        total: 0,
      })
    }

    const results = await searchAllApps(session.user.id, query, app)

    return NextResponse.json({
      success: true,
      query,
      results,
      total: results.length,
    })
  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    )
  }
}

/**
 * 全アプリを検索（SQLite対応：アプリケーション側でcase-insensitiveフィルタリング）
 */
async function searchAllApps(
  userId: string,
  query: string,
  app: string
): Promise<Array<{ type: string; item: any }>> {
  const results: Array<{ type: string; item: any }> = []
  const queryLower = query.toLowerCase()

  console.log(`[DEBUG] Searching: userId=${userId}, query="${query}", app="${app}"`)

  // タスク検索
  if (app === "all" || app === "tasks") {
    const allTasks = await prisma.task.findMany({
      where: { userId },
      take: 100,
      orderBy: { createdAt: "desc" },
    })

    const tasks = allTasks.filter(task =>
      task.title.toLowerCase().includes(queryLower) ||
      (task.description && task.description.toLowerCase().includes(queryLower))
    ).slice(0, 20)

    console.log(`[DEBUG] Found ${tasks.length} tasks`)

    tasks.forEach((task) => {
      results.push({
        type: "task",
        item: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          url: `/hub/tasks`,
        },
      })
    })
  }

  // 就活検索
  if (app === "all" || app === "jobhunt") {
    const allJobApps = await prisma.jobApplication.findMany({
      where: { userId },
      take: 100,
      orderBy: { appliedDate: "desc" },
    })

    const jobApps = allJobApps.filter(jobApp =>
      jobApp.company.toLowerCase().includes(queryLower) ||
      (jobApp.position && jobApp.position.toLowerCase().includes(queryLower)) ||
      (jobApp.notes && jobApp.notes.toLowerCase().includes(queryLower))
    ).slice(0, 20)

    console.log(`[DEBUG] Found ${jobApps.length} job applications`)

    jobApps.forEach((jobApp) => {
      results.push({
        type: "job_application",
        item: {
          id: jobApp.id,
          title: jobApp.company,
          description: `${jobApp.position || ""} ${jobApp.notes ? `- ${jobApp.notes}` : ""}`.trim(),
          company: jobApp.company,
          position: jobApp.position,
          status: jobApp.status,
          appliedDate: jobApp.appliedDate,
          url: `/hub/jobhunt`,
        },
      })
    })
  }

  // バケツリスト検索
  if (app === "all" || app === "bucket") {
    const allBucketItems = await prisma.bucketListItem.findMany({
      where: { userId },
      take: 100,
      orderBy: { createdAt: "desc" },
    })

    const bucketItems = allBucketItems.filter(item =>
      item.title.toLowerCase().includes(queryLower) ||
      (item.description && item.description.toLowerCase().includes(queryLower))
    ).slice(0, 20)

    console.log(`[DEBUG] Found ${bucketItems.length} bucket items`)

    bucketItems.forEach((item) => {
      results.push({
        type: "bucket_list_item",
        item: {
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          status: item.status,
          targetDate: item.targetDate,
          priority: item.priority,
          url: `/hub/bucket`,
        },
      })
    })
  }

  // AtCoder問題検索
  if (app === "all" || app === "atcoder") {
    const allAtCoderProblems = await prisma.atCoderUserProblem.findMany({
      where: { userId },
      include: { problem: true },
      take: 100,
      orderBy: { updatedAt: "desc" },
    })

    const atCoderProblems = allAtCoderProblems.filter(userProblem =>
      userProblem.problem?.title.toLowerCase().includes(queryLower) ||
      userProblem.problemId.toLowerCase().includes(queryLower)
    ).slice(0, 20)

    console.log(`[DEBUG] Found ${atCoderProblems.length} AtCoder problems`)

    atCoderProblems.forEach((userProblem) => {
      results.push({
        type: "atcoder_problem",
        item: {
          id: userProblem.problemId,
          title: userProblem.problem?.title || userProblem.problemId,
          description: `難易度: ${userProblem.problem?.difficulty || "-"} | ステータス: ${userProblem.status}`,
          problemId: userProblem.problemId,
          status: userProblem.status,
          difficulty: userProblem.problem?.difficulty,
          url: `/hub/atcoder`,
        },
      })
    })
  }

  console.log(`[DEBUG] Total results: ${results.length}`)

  return results
}
