"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogOverlay,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Search,
  Command,
  FileText,
  Briefcase,
  Sparkles,
  Code2,
  Gamepad2,
  BarChart3,
  Settings,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface CommandItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  action: () => void
  category: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()

  const commands: CommandItem[] = [
    {
      icon: Search,
      label: "検索",
      description: "全アプリ横断検索",
      action: () => router.push("/hub/search"),
      category: "ナビゲーション",
    },
    {
      icon: FileText,
      label: "タスク管理",
      description: "日々のタスクを管理",
      action: () => router.push("/hub/tasks"),
      category: "アプリケーション",
    },
    {
      icon: Briefcase,
      label: "就活管理",
      description: "就職活動を管理",
      action: () => router.push("/hub/jobhunt"),
      category: "アプリケーション",
    },
    {
      icon: Sparkles,
      label: "バケツリスト",
      description: "やりたいことを管理",
      action: () => router.push("/hub/bucket"),
      category: "アプリケーション",
    },
    {
      icon: Code2,
      label: "AtCoder",
      description: "競技プログラミング管理",
      action: () => router.push("/hub/atcoder"),
      category: "アプリケーション",
    },
    {
      icon: Gamepad2,
      label: "メディア管理",
      description: "ゲームと読書を管理",
      action: () => router.push("/hub/media"),
      category: "アプリケーション",
    },
    {
      icon: BarChart3,
      label: "ダッシュボード",
      description: "統計情報を確認",
      action: () => router.push("/hub/dashboard"),
      category: "分析",
    },
    {
      icon: Settings,
      label: "設定",
      description: "アプリケーション設定",
      action: () => router.push("/hub/settings"),
      category: "設定",
    },
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Input要素、Textarea要素、編集可能な要素内では無効化
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filteredCommands = query
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands

  const categories = Array.from(new Set(filteredCommands.map((cmd) => cmd.category)))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogOverlay />
      <DialogContent className="p-0 max-w-2xl [&_.absolute.right-4.top-4]:hidden">
        <div className="flex flex-col">
          {/* ヘッダーセクション（検索ボックス + 閉じるボタン） */}
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Search className="h-5 w-5 shrink-0 opacity-50" />
            <Input
              placeholder="コマンドを検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
              autoFocus
            />
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-2 py-1 font-mono text-[10px] font-medium opacity-60">
              <span className="text-xs">⌘</span>K
            </kbd>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => {
                setOpen(false)
                setQuery("")
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">閉じる</span>
            </Button>
          </div>

          {/* コマンドリスト */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {categories.map((category) => (
              <div key={category} className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {category}
                </div>
                {filteredCommands
                  .filter((cmd) => cmd.category === category)
                  .map((command, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        command.action()
                        setOpen(false)
                        setQuery("")
                      }}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <command.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{command.label}</div>
                        <div className="text-xs text-muted-foreground">{command.description}</div>
                      </div>
                    </button>
                  ))}
              </div>
            ))}

            {filteredCommands.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                該当するコマンドがありません
              </div>
            )}
          </div>

          {/* ヒント */}
          <div className="border-t p-3 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                    <span className="text-xs">↑</span>
                    <span className="text-xs">↓</span>
                  </kbd>
                  <span>で選択</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                    <span className="text-xs">↵</span>
                  </kbd>
                  <span>で決定</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                    <span className="text-xs">esc</span>
                  </kbd>
                  <span>でキャンセル</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
