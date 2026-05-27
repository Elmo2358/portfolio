import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AtCoderContestsClient } from "./client"

export default async function AtCoderContestsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/api/auth/signin")
  }

  // ユーザーの問題進捗を取得
  const userProblems = await prisma.atCoderUserProblem.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      status: true,
    },
  })

  const solvedProblemIds = new Set(
    userProblems
      .filter(p => p.status === "contest_ac" || p.status === "upsolved_ac")
      .map(p => p.id)
  )

  return <AtCoderContestsClient solvedProblemIds={solvedProblemIds} />
}
