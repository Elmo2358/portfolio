import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE /api/hub/finance/income/[id] - 収入削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const existingIncome = await prisma.income.findUnique({
      where: { id }
    })

    if (!existingIncome) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 })
    }

    if (existingIncome.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.income.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Income deleted successfully" })
  } catch (error) {
    console.error("Error deleting income:", error)
    return NextResponse.json({ error: "Failed to delete income" }, { status: 500 })
  }
}
