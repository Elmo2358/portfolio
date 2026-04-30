import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/hub/finance/summary - 収支サマリー取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    // 指定された年月の範囲を計算
    const targetYear = year ? parseInt(year) : new Date().getFullYear()
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1

    const startDate = new Date(targetYear, targetMonth - 1, 1)
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59)

    // 月次の収入を集計
    const incomes = await prisma.income.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // 月次の支出を集計
    const expenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // カテゴリ別の支出集計
    const expenseByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount.toString())
      return acc
    }, {} as Record<string, number>)

    // カテゴリ別の収入集計
    const incomeByCategory = incomes.reduce((acc, income) => {
      acc[income.category] = (acc[income.category] || 0) + parseFloat(income.amount.toString())
      return acc
    }, {} as Record<string, number>)

    const totalIncome = incomes.reduce((sum, income) => sum + parseFloat(income.amount.toString()), 0)
    const totalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0)

    return NextResponse.json({
      period: {
        year: targetYear,
        month: targetMonth
      },
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense
      },
      incomeByCategory,
      expenseByCategory,
      incomeCount: incomes.length,
      expenseCount: expenses.length
    })
  } catch (error) {
    console.error("Error fetching finance summary:", error)
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 })
  }
}
