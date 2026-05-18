import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { JobHuntManager } from "@/components/hub/jobhunt-manager"

export default async function JobHuntPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">ログインが必要です</p>
        </div>
      </div>
    )
  }

  // サーバーサイドで初期データを取得
  const applications = await prisma.jobApplication.findMany({
    where: { userId: session.user.id },
    orderBy: { appliedDate: "desc" }
  })

  // 日付をISO文字列に変換
  const serializedApps = applications.map(app => ({
    ...app,
    appliedDate: app.appliedDate.toISOString(),
    createdAt: app.createdAt.toISOString()
  }))

  return (
    <div className="container py-8 animate-fadeIn">
      <JobHuntManager initialApplications={serializedApps} />
    </div>
  )
}
