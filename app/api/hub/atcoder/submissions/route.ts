import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: ユーザーの提出一覧を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const result = searchParams.get("result")

    const where: any = { userId: session.user.id }
    if (result) {
      where.result = result
    }

    const submissions = await prisma.atCoderSubmission.findMany({
      where,
      orderBy: { epochSecond: "desc" },
      take: limit,
      include: { problem: true },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    )
  }
}
