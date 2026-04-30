import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/hub/finance/income - 収入一覧取得
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

    const incomes = await prisma.income.findMany({
      where: {
        userId: user.id,
        ...(startDate && { date: { gte: new Date(startDate) } }),
        ...(endDate && { date: { lte: new Date(endDate) } }),
        ...(category && category !== "all" && { category })
      },
      orderBy: { date: "desc" }
    })

    return NextResponse.json(incomes)
  } catch (error) {
    console.error("Error fetching incomes:", error)
    return NextResponse.json({ error: "Failed to fetch incomes" }, { status: 500 })
  }
}

// POST /api/hub/finance/income - 収入作成
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
    const { source, amount, date, description, category } = body

    // バリデーション
    if (!source || source.trim().length === 0) {
      return NextResponse.json({ error: "Source is required" }, { status: 400 })
    }

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    if (!category || !["バイト", "奨学金", "その他"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    const income = await prisma.income.create({
      data: {
        userId: user.id,
        source: source.trim(),
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        description: description?.trim() || null,
        category
      }
    })

    return NextResponse.json(income, { status: 201 })
  } catch (error) {
    console.error("Error creating income:", error)
    return NextResponse.json({ error: "Failed to create income" }, { status: 500 })
  }
}
