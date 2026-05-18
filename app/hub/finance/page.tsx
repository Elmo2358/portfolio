import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FinanceManager } from "@/components/hub/finance-manager"

export default async function FinancePage({
  searchParams
}: {
  searchParams: { type?: string }
}) {
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

  const initialTab = searchParams.type === "income" ? "income" : searchParams.type === "expense" ? "expense" : "dashboard"

  // 現在の月のデータを取得
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({
      where: {
        userId: session.user.id,
        date: { gte: new Date(startDate), lte: new Date(endDate) }
      },
      orderBy: { date: "desc" }
    }),
    prisma.expense.findMany({
      where: {
        userId: session.user.id,
        date: { gte: new Date(startDate), lte: new Date(endDate) }
      },
      orderBy: { date: "desc" }
    })
  ])

  // 日付をISO文字列に変換
  const serializedIncomes = incomes.map(inc => ({
    ...inc,
    date: inc.date.toISOString(),
    createdAt: inc.createdAt.toISOString()
  }))

  const serializedExpenses = expenses.map(exp => ({
    ...exp,
    date: exp.date.toISOString(),
    createdAt: exp.createdAt.toISOString()
  }))

  return (
    <div className="container py-8 animate-fadeIn">
      <FinanceManager
        initialTab={initialTab}
        initialIncomes={serializedIncomes}
        initialExpenses={serializedExpenses}
      />
    </div>
  )
}
