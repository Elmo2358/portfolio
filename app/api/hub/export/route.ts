import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * ユーザーデータをエクスポート
 * GET /api/hub/export?format=json|csv&app=all|tasks|jobhunt|bucket|atcoder
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") || "json" // json or csv
    const app = searchParams.get("app") || "all" // all, tasks, jobhunt, bucket, atcoder

    // データを取得
    const data = await exportUserData(session.user.id, app)

    if (format === "csv") {
      // CSV形式で返す
      const csv = convertToCSV(data, app)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${app}_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else {
      // JSON形式で返す
      return NextResponse.json(data, {
        headers: {
          "Content-Disposition": `attachment; filename="${app}_export_${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}

/**
 * ユーザーデータを取得
 */
async function exportUserData(userId: string, app: string) {
  const data: any = {
    exportDate: new Date().toISOString(),
    userId,
  }

  switch (app) {
    case "tasks":
      data.tasks = await prisma.task.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })
      break

    case "jobhunt":
      data.jobApplications = await prisma.jobApplication.findMany({
        where: { userId },
        orderBy: { appliedDate: "desc" },
      })
      break

    case "bucket":
      data.bucketListItems = await prisma.bucketListItem.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })
      break

    case "atcoder":
      const [problems, submissions, stats] = await Promise.all([
        prisma.atCoderUserProblem.findMany({
          where: { userId },
          include: { problem: true },
          take: 1000,
        }),
        prisma.atCoderSubmission.findMany({
          where: { userId },
          orderBy: { epochSecond: "desc" },
          take: 1000,
        }),
        prisma.atCoderUserProblem.findMany({
          where: { userId },
        }).then((problems) => ({
          total: problems.length,
          solved: problems.filter((p) => p.status === "upsolved_ac" || p.status === "contest_ac").length,
        })),
      ])
      data.atcoder = {
        problems: problems.map((p) => ({
          problemId: p.problemId,
          status: p.status,
          title: p.problem?.title,
          difficulty: p.problem?.difficulty,
          contestId: p.problem?.contestId,
        })),
        submissions: submissions.map((s) => ({
          id: s.id,
          problemId: s.problemId,
          result: s.result,
          epochSecond: s.epochSecond,
        })),
        stats,
      }
      break

    case "all":
    default:
      const [allTasks, allJobApplications, allBucketItems, atcoderData] =
        await Promise.all([
          prisma.task.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
          }),
          prisma.jobApplication.findMany({
            where: { userId },
            orderBy: { appliedDate: "desc" },
          }),
          prisma.bucketListItem.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
          }),
          exportUserData(userId, "atcoder").then((result) => result.atcoder),
        ])

      data.tasks = allTasks
      data.jobApplications = allJobApplications
      data.bucketListItems = allBucketItems
      data.atcoder = atcoderData
      break
  }

  return data
}

/**
 * データをCSV形式に変換
 */
function convertToCSV(data: any, app: string): string {
  const rows: string[] = []
  let headers: string[] = []

  switch (app) {
    case "tasks":
      headers = ["ID", "Title", "Description", "Status", "Priority", "Due Date", "Created At"]
      rows.push(headers.join(","))
      data.tasks.forEach((task: any) => {
        rows.push([
          task.id,
          escapeCSV(task.title),
          escapeCSV(task.description || ""),
          task.status,
          task.priority,
          task.dueDate || "",
          task.createdAt,
        ].join(","))
      })
      break

    case "jobhunt":
      headers = ["ID", "Company", "Type", "Position", "Status", "Applied Date", "Notes"]
      rows.push(headers.join(","))
      data.jobApplications.forEach((app: any) => {
        rows.push([
          app.id,
          escapeCSV(app.company),
          app.type,
          escapeCSV(app.position || ""),
          app.status,
          app.appliedDate,
          escapeCSV(app.notes || ""),
        ].join(","))
      })
      break

    case "bucket":
      headers = ["ID", "Title", "Category", "Status", "Target Date", "Priority", "Created At"]
      rows.push(headers.join(","))
      data.bucketListItems.forEach((item: any) => {
        rows.push([
          item.id,
          escapeCSV(item.title),
          item.category,
          item.status,
          item.targetDate || "",
          item.priority,
          item.createdAt,
        ].join(","))
      })
      break

    case "atcoder":
      headers = ["Problem ID", "Title", "Status", "Difficulty", "Contest ID"]
      rows.push(headers.join(","))
      data.atcoder.problems.forEach((problem: any) => {
        rows.push([
          problem.problemId,
          escapeCSV(problem.title || ""),
          problem.status,
          problem.difficulty || "",
          problem.contestId || "",
        ].join(","))
      })
      break

    case "all":
    default:
      // 全データの場合は、アプリごとにセクションを分けて出力
      rows.push(`=== EXPORT DATE: ${data.exportDate} ===`)
      rows.push("")

      if (data.tasks?.length > 0) {
        rows.push("=== TASKS ===")
        rows.push(...convertToCSV({ tasks: data.tasks }, "tasks").split("\n").filter(Boolean))
        rows.push("")
      }

      if (data.jobApplications?.length > 0) {
        rows.push("=== JOB APPLICATIONS ===")
        rows.push(...convertToCSV({ jobApplications: data.jobApplications }, "jobhunt").split("\n").filter(Boolean))
        rows.push("")
      }

      if (data.bucketListItems?.length > 0) {
        rows.push("=== BUCKET LIST ===")
        rows.push(...convertToCSV({ bucketListItems: data.bucketListItems }, "bucket").split("\n").filter(Boolean))
        rows.push("")
      }

      if (data.atcoder?.problems?.length > 0) {
        rows.push("=== ATCODER ===")
        rows.push(...convertToCSV({ atcoder: data.atcoder }, "atcoder").split("\n").filter(Boolean))
      }
      break
  }

  return rows.join("\n")
}

/**
 * CSVのエスケープ処理
 */
function escapeCSV(str: string): string {
  if (!str) return ""
  str = str.replace(/"/g, '""')
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    str = `"${str}"`
  }
  return str
}
