import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/hub/bucket/items - バケツリスト一覧取得
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
    const status = searchParams.get("status")
    const category = searchParams.get("category")

    const items = await prisma.bucketListItem.findMany({
      where: {
        userId: user.id,
        ...(status && status !== "all" && { status }),
        ...(category && category !== "all" && { category })
      },
      orderBy: [
        { priority: "desc" }, // 優先度の高い順
        { targetDate: "asc" }, // 期限が近い順
        { createdAt: "desc" }
      ]
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching bucket list items:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

// POST /api/hub/bucket/items - バケツリスト項目追加
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
    const { title, category, description, status, targetDate, priority } = body

    // バリデーション
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!category || !["travel", "experience", "goal", "other"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    if (!status || !["planning", "in_progress", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (priority !== undefined && (priority < 1 || priority > 5)) {
      return NextResponse.json({ error: "Priority must be between 1 and 5" }, { status: 400 })
    }

    const item = await prisma.bucketListItem.create({
      data: {
        userId: user.id,
        title: title.trim(),
        category,
        description: description?.trim() || null,
        status,
        targetDate: targetDate ? new Date(targetDate) : null,
        priority: priority || 3
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Error creating bucket list item:", error)
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
  }
}
