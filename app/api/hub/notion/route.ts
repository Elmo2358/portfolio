import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { queryDatabase } from "@/lib/notion"

// OPTIONS: CORSプリフライトリクエスト用
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// GET: Notion Wiki連携状態を取得
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        notionWikiEnabled: true,
        notionAccessToken: true,
        notionWikiDatabaseId: true,
      },
    })

    // Wikiデータベースからページ一覧を取得（有効な場合）
    let pages: any[] = []
    if (user?.notionAccessToken && user.notionWikiEnabled && user.notionWikiDatabaseId) {
      try {
        const rawPages = await queryDatabase(user.notionAccessToken, user.notionWikiDatabaseId)
        // 必要な情報だけ抽出
        pages = rawPages.map((page: any) => {
          // タイトルを取得（最初のtitleプロパティ）
          let title = "Untitled"
          const titleProp = Object.values(page.properties).find((prop: any) => prop.type === "title")
          if (titleProp && (titleProp as any).title?.[0]?.text?.content) {
            title = (titleProp as any).title[0].text.content
          }

          // 最終更新日を取得
          const lastEdited = page.last_edited_time

          return {
            id: page.id,
            title,
            url: page.url,
            lastEdited,
            icon: page.icon,
            cover: page.cover,
          }
        })
      } catch (error) {
        console.error("Error fetching wiki pages:", error)
      }
    }

    return NextResponse.json({
      success: true,
      isConnected: !!user?.notionAccessToken,
      wikiEnabled: user?.notionWikiEnabled || false,
      wikiDatabaseId: user?.notionWikiDatabaseId,
      pages,
    })
  } catch (error) {
    console.error("Error fetching Notion Wiki status:", error)
    return NextResponse.json(
      { error: "Failed to fetch Notion Wiki status" },
      { status: 500 }
    )
  }
}

// POST: Notion Wiki設定を保存
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const { accessToken, databaseId } = body

    if (!accessToken || !databaseId) {
      return NextResponse.json(
        { error: "アクセストークンとデータベースIDは必須です" },
        { status: 400 }
      )
    }

    // Wiki設定を保存
    await prisma.user.update({
      where: { id: user.id },
      data: {
        notionAccessToken: accessToken,
        notionWikiEnabled: true,
        notionWikiDatabaseId: databaseId,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Notion Wiki連携が完了しました！",
    })
  } catch (error) {
    console.error("Error saving Notion Wiki settings:", error)
    return NextResponse.json(
      { error: "Failed to save Notion Wiki settings" },
      { status: 500 }
    )
  }
}

// PUT: Wiki有効/無効を切り替え
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const { enabled } = body

    await prisma.user.update({
      where: { id: user.id },
      data: {
        notionWikiEnabled: enabled,
      },
    })

    return NextResponse.json({
      success: true,
      message: enabled ? "Wikiを有効にしました" : "Wikiを無効にしました",
    })
  } catch (error) {
    console.error("Error updating Notion Wiki settings:", error)
    return NextResponse.json(
      { error: "Failed to update Notion Wiki settings" },
      { status: 500 }
    )
  }
}

// DELETE: Notion連携を解除
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        notionWikiEnabled: false,
        notionAccessToken: null,
        notionWikiDatabaseId: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Notion連携を解除しました",
    })
  } catch (error) {
    console.error("Error removing Notion settings:", error)
    return NextResponse.json(
      { error: "Failed to remove Notion settings" },
      { status: 500 }
    )
  }
}
