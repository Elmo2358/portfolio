"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatInterfaceProps {
  problemId?: string
  problemTitle?: string
  problemUrl?: string
  className?: string
}

export function ChatInterface({
  problemId,
  problemTitle,
  problemUrl,
  className = "",
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 自動スクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setError(null)
    setIsLoading(true)

    // ユーザーメッセージを追加
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    // アシスタントメッセージのプレースホルダー
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch("/api/ai/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          problemId,
          problemTitle,
          problemUrl,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.setupRequired) {
          setError("Claude APIキーが設定されていません。設定画面からAPIキーを入力してください。")
          toast.error("APIキーが必要です")
        } else {
          throw new Error(errorData.error || "Failed to get response")
        }
        setMessages((prev) => prev.slice(0, -1)) // プレースホルダーを削除
        setIsLoading(false)
        return
      }

      // ストリーミングレスポンスの処理
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      if (!reader) {
        throw new Error("No response body")
      }

      let assistantMessage = ""
      let finalConversationId: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)

              if (parsed.content) {
                assistantMessage += parsed.content
                setMessages((prev) => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = { role: "assistant", content: assistantMessage }
                  return newMessages
                })
              }

              if (parsed.done) {
                finalConversationId = parsed.conversationId
              }

              if (parsed.error) {
                throw new Error(parsed.error)
              }
            } catch {
              // パースエラーは無視
            }
          }
        }
      }

      if (finalConversationId) {
        setConversationId(finalConversationId)
      }

      setIsLoading(false)
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message)
        toast.error("エラーが発生しました")
      }
      setMessages((prev) => prev.slice(0, -1)) // プレースホルダーを削除
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const clearChat = () => {
    setMessages([])
    setConversationId(null)
    setError(null)
  }

  return (
    <Card className={`flex flex-col h-[600px] ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b bg-emerald-50 dark:bg-emerald-950">
        <div>
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
            AI Q&A チャット
          </h3>
          {problemTitle && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {problemTitle}
            </p>
          )}
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-emerald-600 hover:text-emerald-700"
          >
            クリア
          </Button>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950 border-b flex items-start gap-2 text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* メッセージエリア */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="max-w-md">
              <p className="text-emerald-600 dark:text-emerald-400 mb-2">
                AtCoderや競技プログラミングについて質問してください
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                問題のヒント、解法の解説、アルゴリズムの説明などができます
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "assistant" && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* 入力エリア */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="質問を入力... (Shift+Enterで改行)"
            className="resize-none"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="self-end bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Enterで送信、Shift+Enterで改行
        </p>
      </div>
    </Card>
  )
}
