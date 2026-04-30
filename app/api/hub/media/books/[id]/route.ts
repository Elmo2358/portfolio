import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/hub/media/books/[id] - 本更新
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

    const existingBook = await prisma.book.findUnique({
      where: { id: params.id }
    })

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    if (existingBook.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { title, author, genre, completed, rating, notes } = body

    // バリデーション
    if (title !== undefined && title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // completedがtrueになったときはcompletedAtを設定
    let completedAt = undefined
    if (completed === true && !existingBook.completed) {
      completedAt = new Date()
    } else if (completed === false) {
      completedAt = null
    }

    const book = await prisma.book.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(author !== undefined && { author: author.trim() || null }),
        ...(genre !== undefined && { genre: genre.trim() || null }),
        ...(completed !== undefined && { completed }),
        ...(completedAt !== undefined && { completedAt }),
        ...(rating !== undefined && { rating }),
        ...(notes !== undefined && { notes: notes.trim() || null })
      }
    })

    return NextResponse.json(book)
  } catch (error) {
    console.error("Error updating book:", error)
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 })
  }
}

// DELETE /api/hub/media/books/[id] - 本削除
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

    const existingBook = await prisma.book.findUnique({
      where: { id: params.id }
    })

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    if (existingBook.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.book.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Book deleted successfully" })
  } catch (error) {
    console.error("Error deleting book:", error)
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 })
  }
}
