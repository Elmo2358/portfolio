import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AtCoderProblemsClient } from "./client"

export default async function AtCoderProblemsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/api/auth/signin")
  }

  // サーバーサイドで初期データを取得
  const problems = await prisma.atCoderUserProblem.findMany({
    where: { userId: session.user.id },
    orderBy: { lastAttempted: "desc" },
    take: 50
  })

  // 日付をISO文字列に変換
  const serializedProblems = problems.map(problem => ({
    ...problem,
    lastAttempted: problem.lastAttempted?.toISOString() || null,
    createdAt: problem.createdAt.toISOString()
  }))

  return <AtCoderProblemsClient initialProblems={serializedProblems} />
}
