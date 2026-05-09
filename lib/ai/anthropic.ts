// z.ai APIクライアント（Anthropic互換）

const ZAI_API_BASE = "https://api.z.ai/api/anthropic/v1/messages"
const ANTHROPIC_VERSION = "2023-06-01"

export interface Message {
  role: "user" | "assistant"
  content: string
}

export interface CompletionOptions {
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

export interface StreamCompletionOptions extends CompletionOptions {
  onChunk: (chunk: string) => void
  onComplete: () => void
  onError: (error: Error) => void
}

/**
 * z.ai APIでテキスト生成を行う
 */
export async function generateCompletion(
  apiKey: string,
  messages: Message[],
  options: CompletionOptions = {}
): Promise<string> {
  const { maxTokens = 1024, temperature = 0.7, systemPrompt } = options

  const response = await fetch(ZAI_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: "glm-4.7",
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`z.ai API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.content[0].text
}

/**
 * z.ai APIでストリーミングテキスト生成を行う
 */
export async function streamCompletion(
  apiKey: string,
  messages: Message[],
  options: StreamCompletionOptions
): Promise<void> {
  const { maxTokens = 1024, temperature = 0.7, systemPrompt, onChunk, onComplete, onError } = options

  try {
    const response = await fetch(ZAI_API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: "glm-4.7",
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages,
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`z.ai API error: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("Response body is not readable")
    }

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              onChunk(parsed.delta.text)
            }
          } catch {
            // パースエラーは無視
          }
        }
      }
    }

    onComplete()
  } catch (error) {
    onError(error as Error)
  }
}

/**
 * ユーザーのz.ai APIキーを取得
 */
export async function getUserApiKey(userId: string): Promise<string | null> {
  const { prisma } = await import("@/lib/prisma")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { claudeApiKey: true, claudeApiEnabled: true },
  })

  console.log("getUserApiKey result:", {
    userId,
    hasApiKey: !!user?.claudeApiKey,
    apiEnabled: user?.claudeApiEnabled,
    keyPrefix: user?.claudeApiKey ? user.claudeApiKey.slice(0, 8) : "none",
  })

  if (!user?.claudeApiEnabled || !user?.claudeApiKey) {
    return null
  }

  return user.claudeApiKey
}

/**
 * デフォルトのAPIキーを取得（サーバー側設定）
 */
export function getDefaultApiKey(): string | null {
  return process.env.ZAI_API_KEY || null
}
