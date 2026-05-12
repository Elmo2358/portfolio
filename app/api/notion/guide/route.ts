import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const NOTION_API_BASE = "https://api.notion.com/v1"

interface GuideContent {
  title: string
}

// POST: Notion Wikiにガイドページを追加
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        notionAccessToken: true,
        notionWikiDatabaseId: true,
        notionWikiEnabled: true,
      },
    })

    if (!user?.notionAccessToken || !user.notionWikiDatabaseId || !user.notionWikiEnabled) {
      return NextResponse.json({
        error: "Notion Wiki連携が設定されていません。設定ページから連携してください。"
      }, { status: 400 })
    }

    const body = await req.json() as GuideContent
    const title = body.title || "アプリケーション使い方ガイド"

    // ガイドページの内容を作成
    const content = createGuideContent()

    // Notionのデータベーススキーマを取得してタイトルプロパティを特定
    const schemaResponse = await fetch(`${NOTION_API_BASE}/databases/${user.notionWikiDatabaseId}`, {
      headers: {
        Authorization: `Bearer ${user.notionAccessToken}`,
        "Notion-Version": "2022-06-28",
      },
    })

    if (!schemaResponse.ok) {
      const errorText = await schemaResponse.text()
      console.error("Notion API error:", errorText)
      return NextResponse.json({ error: "Notionデータベースの取得に失敗しました" }, { status: 500 })
    }

    const schema = await schemaResponse.json()

    // 最初のtitleプロパティを探す
    let titleProperty = ""
    for (const [key, prop] of Object.entries(schema.properties)) {
      if ((prop as any).type === "title") {
        titleProperty = key
        break
      }
    }

    if (!titleProperty) {
      return NextResponse.json({ error: "データベースにtitleプロパティが見つかりません" }, { status: 400 })
    }

    // ページを作成
    const pageResponse = await fetch(`${NOTION_API_BASE}/pages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.notionAccessToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: {
          database_id: user.notionWikiDatabaseId,
        },
        properties: {
          [titleProperty]: {
            title: [
              {
                text: {
                  content: title,
                },
              },
            ],
          },
        },
        children: content,
      }),
    })

    if (!pageResponse.ok) {
      const errorText = await pageResponse.text()
      console.error("Notion API error:", errorText)
      return NextResponse.json({ error: "ページの作成に失敗しました" }, { status: 500 })
    }

    const pageData = await pageResponse.json()

    return NextResponse.json({
      success: true,
      message: "ガイドページをNotion Wikiに追加しました！",
      url: pageData.url,
      pageId: pageData.id,
    })
  } catch (error) {
    console.error("Error creating guide page:", error)
    return NextResponse.json({ error: "ガイドページの作成に失敗しました" }, { status: 500 })
  }
}

// ガイドページの内容を作成
function createGuideContent() {
  const now = new Date()
  const dateStr = now.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })

  return [
    {
      object: "block",
      type: "heading_1",
      heading_1: {
        rich_text: [
          {
            type: "text",
            text: { content: "📚 アプリケーション使い方ガイド" }
          }
        ]
      }
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: { content: `作成日: ${dateStr}\nバージョン: 2026年夏季最新版` }
          }
        ]
      }
    },
    {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            type: "text",
            text: { content: "🎯 2026年夏季の目標" }
          }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "💼 " } },
          { type: "text", text: { content: "サマーインターン内定" }, annotations: { bold: true } },
          { type: "text", text: { content: "：就活管理で応募・選考状況を追跡" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "💻 " } },
          { type: "text", text: { content: "茶色コーダー（Rating 800-）" }, annotations: { bold: true } },
          { type: "text", text: { content: "：AtCoder学習で毎日問題を解く" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "💰 " } },
          { type: "text", text: { content: "家計管理の習慣化" }, annotations: { bold: true } },
          { type: "text", text: { content: "：毎日の収支を記録して貯金を把握" } }
        ]
      }
    },
    {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            type: "text",
            text: { content: "⏰ 毎日のルーチン" }
          }
        ]
      }
    },
    {
      object: "block",
      type: "numbered_list_item",
      numbered_list_item: {
        rich_text: [
          { type: "text", text: { content: "📋 タスク管理：その日のタスクを確認、完了したものをチェック" } }
        ]
      }
    },
    {
      object: "block",
      type: "numbered_list_item",
      numbered_list_item: {
        rich_text: [
          { type: "text", text: { content: "💻 AtCoder：1問以上解く、ヒートマップを記録" } }
        ]
      }
    },
    {
      object: "block",
      type: "numbered_list_item",
      numbered_list_item: {
        rich_text: [
          { type: "text", text: { content: "💴 家計簿：その日の支出を記録" } }
        ]
      }
    },
    {
      object: "block",
      type: "numbered_list_item",
      numbered_list_item: {
        rich_text: [
          { type: "text", text: { content: "💼 就活管理：応募状況を確認、ES提出日・面接日をチェック" } }
        ]
      }
    },
    {
      object: "block",
      type: "numbered_list_item",
      numbered_list_item: {
        rich_text: [
          { type: "text", text: { content: "📋 タスク管理：翌日のタスクを予定" } }
        ]
      }
    },
    {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            type: "text",
            text: { content: "📱 アプリケーション別ガイド" }
          }
        ]
      }
    },
    {
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: [
          {
            type: "text",
            text: { content: "✅ タスク管理（毎日）" }
          }
        ]
      }
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: "日々のタスクを管理し、進捗を確認します" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "毎日朝にその日のタスクを確認" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "完了したタスクをチェック" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "翌日のタスクを予定" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "週末に今週の振り返り" } }
        ]
      }
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: "💡 ヒント: タスクは小さく分けて管理すると達成感があります。期限を設定すると優先順位がつけやすくなります。" } }
        ]
      }
    },
    {
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: [
          {
            type: "text",
            text: { content: "💻 AtCoder学習（毎日）" }
          }
        ]
      }
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: "競技プログラミングの学習進捗を管理し、茶色コーダーを目指します" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "毎日1問以上の問題を解く" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "ヒートマップで学習習慣を維持" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "AI機能でヒントや解説を確認" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "問題推薦で適正な難易度の問題に挑戦" } }
        ]
      }
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: "💡 ヒント: 初心者向けはA問題 → B問題 → C問題の順に進みましょう。わからない問題はAI Q&Aでヒントをもらえます。" } }
        ]
      }
    },
    {
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: [
          {
            type: "text",
            text: { content: "💴 家計簿（毎日）" }
          }
        ]
      }
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: "収入と支出を記録し、貯金状況を把握します" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "毎日の支出を記録" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "現状の貯金額を把握" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "先月までのクレジットカード引き落としを記録" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "今月以降は詳細な収支明細をつける" } }
        ]
      }
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: "💡 ヒント: クレジットカードの利用明細をそのまま記録するのが簡単です。固定費と変動費を分けて管理すると見やすくなります。" } }
        ]
      }
    },
    {
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: [
          {
            type: "text",
            text: { content: "💼 就活管理（毎日）" }
          }
        ]
      }
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: "サマーインターンの応募管理と選考状況を追跡します" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "サマーインターンの企業をリストアップ" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "応募状況と選考進捗を管理" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "ES提出日、面接日を記録" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "結果を記録して次回に活かす" } }
        ]
      }
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: "💡 ヒント: 企業ごとにカードを作成して管理すると見やすくなります。選考ステータスを更新して漏れを防ぎましょう。" } }
        ]
      }
    },
    {
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: [
          {
            type: "text",
            text: { content: "📖 Wiki（毎週）" }
          }
        ]
      }
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: "Notionで作成したWiki・ドキュメントを管理します" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "学習メモを残す" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "プロジェクトの情報を整理" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "技術記事をアーカイブ" } }
        ]
      }
    },
    {
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: [
          {
            type: "text",
            text: { content: "🎮 メディア管理（随時）" }
          }
        ]
      }
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: "ゲームと読書の履歴を記録します" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "遊んだゲームを記録" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "読んだ本を記録" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "評価と感想を残す" } }
        ]
      }
    },
    {
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: [
          {
            type: "text",
            text: { content: "✨ やりたいことリスト（随時）" }
          }
        ]
      }
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: "旅行ややりたいことを計画・管理します" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "やりたいことをリストアップ" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "進捗を管理" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "達成したことを記録" } }
        ]
      }
    },
    {
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: [
          {
            type: "text",
            text: { content: "🎓 UECポータル（毎週）" }
          }
        ]
      }
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: "大学からのお知らせ・予定・時間割を確認します" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "重要なお知らせを見逃さない" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "課題提出期限を確認" } }
        ]
      }
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: "時間割を確認" } }
        ]
      }
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: "💡 ヒント: 未読フィルターで重要なお知らせを素早く確認できます。数日に1回の同期（npm run uec:sync）で最新情報を取得できます。" } }
        ]
      }
    }
  ]
}
