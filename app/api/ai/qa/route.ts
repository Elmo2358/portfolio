import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserApiKey, getDefaultApiKey, streamCompletion, type Message } from "@/lib/ai/anthropic"
import { QA_PROMPTS } from "@/lib/ai/prompts/atcoder"

// POST: ストリーミングチャット
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return new Response("User not found", { status: 404 })
    }

    // z.ai APIキーの確認
    const apiKey = user.claudeApiKey || getDefaultApiKey()
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "z.ai API key not configured", setupRequired: true }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await req.json()
    const { message, conversationId, problemId, problemTitle, problemUrl } = body

    if (!message || typeof message !== "string") {
      return new Response("Invalid message", { status: 400 })
    }

    // 会話履歴を取得
    let messages: Message[] = []
    let currentConversationId = conversationId

    if (conversationId) {
      const conversation = await prisma.qaConversation.findUnique({
        where: { id: conversationId },
      })

      if (conversation && conversation.userId === user.id) {
        messages = JSON.parse(conversation.messages)
        // 最大10メッセージの履歴
        messages = messages.slice(-10)
      }
    }

    // 新しいメッセージを追加
    messages.push({ role: "user", content: message })

    // システムプロンプトの構築
    let systemPrompt = QA_PROMPTS.system
    if (problemId && problemTitle) {
      systemPrompt += "\n\n" + QA_PROMPTS.withProblemContext(problemTitle, problemUrl || "")
    }

    // ストリーミングレスポンス
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = ""

        try {
          await streamCompletion(
            apiKey,
            messages,
            {
              maxTokens: 2000,
              temperature: 0.7,
              systemPrompt,
              onChunk: (chunk) => {
                fullResponse += chunk
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
              },
              onComplete: async () => {
                // 会話を保存
                messages.push({ role: "assistant", content: fullResponse })

                let finalConversationId = currentConversationId

                if (!finalConversationId) {
                  // 新しい会話を作成
                  const title = message.slice(0, 50) + (message.length > 50 ? "..." : "")

                  const conversation = await prisma.qaConversation.create({
                    data: {
                      userId: user.id,
                      problemId: problemId || null,
                      title,
                      messages: JSON.stringify(messages),
                    },
                  })
                  finalConversationId = conversation.id
                } else {
                  // 既存の会話を更新
                  await prisma.qaConversation.update({
                    where: { id: finalConversationId },
                    data: {
                      messages: JSON.stringify(messages),
                      updatedAt: new Date(),
                    },
                  })
                }

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: finalConversationId })}\n\n`)
                )
                controller.close()
              },
              onError: (error) => {
                console.error("Stream error:", error)
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
                )
                controller.close()
              },
            }
          )
        } catch (error) {
          console.error("Completion error:", error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response("Internal server error", { status: 500 })
  }
}

// GET: 会話一覧を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return new Response("User not found", { status: 404 })
    }

    const searchParams = req.nextUrl.searchParams
    const problemId = searchParams.get("problemId")
    const limit = parseInt(searchParams.get("limit") || "20", 10)

    const conversations = await prisma.qaConversation.findMany({
      where: {
        userId: user.id,
        ...(problemId ? { problemId } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        problemId: true,
        createdAt: true,
        updatedAt: true,
        messages: true,
      },
    })

    // メッセージの最初の数文字をプレビューとして返す
    const conversationsWithPreview = conversations.map((conv) => {
      const parsedMessages = JSON.parse(conv.messages)
      const lastMessage = parsedMessages[parsedMessages.length - 1]
      return {
        id: conv.id,
        title: conv.title,
        problemId: conv.problemId,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        preview: lastMessage?.content?.slice(0, 100) || "",
        messageCount: parsedMessages.length,
      }
    })

    return new Response(JSON.stringify(conversationsWithPreview), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return new Response("Internal server error", { status: 500 })
  }
}
