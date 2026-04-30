import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            アプリケーションハブ
          </h1>
          <p className="mt-1 text-emerald-700 dark:text-emerald-300">ようこそ、{session.user?.name}さん</p>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="rounded-md border border-emerald-600 bg-background px-4 py-2 text-sm hover:bg-emerald-600 hover:text-white transition-colors dark:border-emerald-500 dark:hover:bg-emerald-500"
          >
            ログアウト
          </button>
        </form>
      </div>
      {children}
    </div>
  )
}
