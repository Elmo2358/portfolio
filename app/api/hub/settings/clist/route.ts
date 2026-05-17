import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: CLIST API設定を保存
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { apiKey, username, enabled } = body

    if (!apiKey) {
      return NextResponse.json({ error: "APIキーが必要です" }, { status: 400 })
    }

    if (!username) {
      return NextResponse.json({ error: "ユーザー名が必要です" }, { status: 400 })
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        clistApiKey: apiKey,
        clistUsername: username,
        clistApiEnabled: enabled !== false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving CLIST settings:", error)
    return NextResponse.json({ error: "設定の保存に失敗しました" }, { status: 500 })
  }
}

// DELETE: CLIST API設定を削除
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        clistApiKey: null,
        clistUsername: null,
        clistApiEnabled: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing CLIST settings:", error)
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 })
  }
}
