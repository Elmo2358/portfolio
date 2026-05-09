import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/hub/jobhunt/applications - 企業一覧取得
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
    const type = searchParams.get("type")

    const applications = await prisma.jobApplication.findMany({
      where: {
        userId: user.id,
        ...(status && status !== "all" && { status }),
        ...(type && type !== "all" && { type })
      },
      orderBy: { appliedDate: "desc" }
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error("Error fetching job applications:", error)
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 })
  }
}

// POST /api/hub/jobhunt/applications - 企業追加
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
    const { type, company, position, status, appliedDate, notes, notionUrl } = body

    // バリデーション
    if (!company || company.trim().length === 0) {
      return NextResponse.json({ error: "Company is required" }, { status: 400 })
    }

    if (type && !["本選考", "インターン"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    if (!status || !["ES提出", "テスト面接", "最終面接", "内定", "落選"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const application = await prisma.jobApplication.create({
      data: {
        userId: user.id,
        type: type || "本選考",
        company: company.trim(),
        position: position?.trim() || null,
        status,
        appliedDate: appliedDate ? new Date(appliedDate) : new Date(),
        notes: notes?.trim() || null,
        notionUrl: notionUrl?.trim() || null
      }
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error("Error creating job application:", error)
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 })
  }
}
