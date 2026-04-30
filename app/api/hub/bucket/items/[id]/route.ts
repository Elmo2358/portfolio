import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/hub/bucket/items/[id] - バケツリスト項目更新
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existingItem = await prisma.bucketListItem.findUnique({
      where: { id: params.id }
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (existingItem.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { title, category, description, status, targetDate, priority } = body

    // バリデーション
    if (title !== undefined && title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (category && !["travel", "experience", "goal", "other"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    if (status && !["planning", "in_progress", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (priority !== undefined && (priority < 1 || priority > 5)) {
      return NextResponse.json({ error: "Priority must be between 1 and 5" }, { status: 400 })
    }

    // completedになったときはcompletedAtを設定
    let completedAt = undefined
    if (status === "completed" && existingItem.status !== "completed") {
      completedAt = new Date()
    } else if (status === "planning" || status === "in_progress") {
      completedAt = null
    }

    const item = await prisma.bucketListItem.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(category && { category }),
        ...(description !== undefined && { description: description.trim() || null }),
        ...(status && { status }),
        ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
        ...(priority !== undefined && { priority }),
        ...(completedAt !== undefined && { completedAt })
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("Error updating bucket list item:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

// DELETE /api/hub/bucket/items/[id] - バケツリスト項目削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existingItem = await prisma.bucketListItem.findUnique({
      where: { id: params.id }
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (existingItem.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.bucketListItem.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Item deleted successfully" })
  } catch (error) {
    console.error("Error deleting bucket list item:", error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
