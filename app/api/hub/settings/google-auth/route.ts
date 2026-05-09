import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Google OAuth連携状態を取得
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log("🔴 Google auth status: Unauthorized (no session)")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔵 Google auth status check for user:", session.user.id)

    // ユーザーのGoogle連携情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        googleAccountId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiresAt: true,
      },
    })

    console.log("🔵 User data:", {
      hasGoogleAccountId: !!user?.googleAccountId,
      hasAccessToken: !!user?.googleAccessToken,
      googleAccountId: user?.googleAccountId,
    })

    // 環境変数が設定されているか確認
    const isConfigured = !!(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET
    )

    console.log("🔵 Google auth configured:", isConfigured)

    return NextResponse.json({
      success: true,
      isConnected: !!user?.googleAccessToken,
      isConfigured,
      googleAccountId: user?.googleAccountId,
    })
  } catch (error) {
    console.error("Error fetching Google auth status:", error)
    return NextResponse.json(
      { error: "Failed to fetch Google auth status" },
      { status: 500 }
    )
  }
}

// POST: Google OAuth連携を保存（コールバック後）
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { accessToken, refreshToken, expiresIn, googleAccountId } = body

    // トークンの有効期限を計算
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : new Date(Date.now() + 3600 * 1000) // デフォルト1時間

    // Google連携情報を保存
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        googleAccountId,
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken,
        googleTokenExpiresAt: expiresAt,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Google連携が完了しました！",
    })
  } catch (error) {
    console.error("Error saving Google auth:", error)
    return NextResponse.json(
      { error: "Failed to save Google auth" },
      { status: 500 }
    )
  }
}

// DELETE: Google OAuth連携を解除
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Google連携情報を削除
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        googleAccountId: null,
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiresAt: null,
        googleTasksEnabled: false,
        googleTasksTasklistId: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Google連携を解除しました",
    })
  } catch (error) {
    console.error("Error removing Google auth:", error)
    return NextResponse.json(
      { error: "Failed to remove Google auth" },
      { status: 500 }
    )
  }
}
