import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/hub/finance/expense - 支出一覧取得
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

    // クエリパラメータ
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const category = searchParams.get("category")

    const expenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        ...(startDate && { date: { gte: new Date(startDate) } }),
        ...(endDate && { date: { lte: new Date(endDate) } }),
        ...(category && category !== "all" && { category })
      },
      orderBy: { date: "desc" }
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}

// POST /api/hub/finance/expense - 支出作成
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { item, amount, date, category, description } = body

    // バリデーション
    if (!item || item.trim().length === 0) {
      return NextResponse.json({ error: "Item is required" }, { status: 400 })
    }

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    if (!category || !["食費", "交通費", "趣味", "書籍", "その他"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        item: item.trim(),
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        category,
        description: description?.trim() || null
      }
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}
