import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { TimerComponent } from "@/components/hub/timer/timer-component"
import { TimerHistory } from "@/components/hub/timer/timer-history"

async function getRecentSessions(userId: string) {
  const sessions = await prisma.timerSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10
  })
  return sessions
}

export default async function TimerPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const recentSessions = await getRecentSessions(session.user.id)

  return (
    <div className="py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            タイマー
          </h1>
          <p className="text-emerald-700 dark:text-emerald-300">
            学習時間を計測・記録します
          </p>
        </div>

        <TimerComponent />

        <div className="mt-8">
          <TimerHistory initialSessions={recentSessions} />
        </div>
      </div>
    </div>
  )
}
