import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/hub/jobhunt/applications/[id] - 企業情報更新
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

    const existingApplication = await prisma.jobApplication.findUnique({
      where: { id: params.id }
    })

    if (!existingApplication) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (existingApplication.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { type, company, position, status, appliedDate, notes, notionUrl } = body

    // バリデーション
    if (company !== undefined && company.trim().length === 0) {
      return NextResponse.json({ error: "Company is required" }, { status: 400 })
    }

    if (type && !["本選考", "インターン"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    if (status && !["ES提出", "テスト面接", "最終面接", "内定", "落選"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const application = await prisma.jobApplication.update({
      where: { id: params.id },
      data: {
        ...(type !== undefined && { type }),
        ...(company !== undefined && { company: company.trim() }),
        ...(position !== undefined && { position: position.trim() || null }),
        ...(status && { status }),
        ...(appliedDate !== undefined && { appliedDate: appliedDate ? new Date(appliedDate) : new Date() }),
        ...(notes !== undefined && { notes: notes.trim() || null }),
        ...(notionUrl !== undefined && { notionUrl: notionUrl.trim() || null })
      }
    })

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error updating job application:", error)
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 })
  }
}

// DELETE /api/hub/jobhunt/applications/[id] - 企業削除
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

    const existingApplication = await prisma.jobApplication.findUnique({
      where: { id: params.id }
    })

    if (!existingApplication) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (existingApplication.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.jobApplication.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Application deleted successfully" })
  } catch (error) {
    console.error("Error deleting job application:", error)
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 })
  }
}
