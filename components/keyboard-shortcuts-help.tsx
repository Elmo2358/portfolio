"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Command, Search, Home, User, Award, BookOpen, FolderKanban, Mail } from "lucide-react"

interface Shortcut {
  key: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
}

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false)

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

      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const shortcuts: Shortcut[] = [
    {
      key: "⌘ / Ctrl + K",
      description: "コマンドパレットを開く",
      icon: Command,
    },
    {
      key: "⌘ / Ctrl + /",
      description: "キーボードショートカット一覧を表示",
      icon: Command,
    },
    {
      key: "Esc",
      description: "モーダルを閉じる",
    },
    {
      key: "⌘ / Ctrl + K",
      description: "検索ボックスにフォーカス（検索ページ）",
      icon: Search,
    },
  ]

  const navigationShortcuts: Shortcut[] = [
    {
      key: "⌥ Alt + H",
      description: "ホーム",
      icon: Home,
    },
    {
      key: "⌥ Alt + A",
      description: "自己紹介",
      icon: User,
    },
    {
      key: "⌥ Alt + Q",
      description: "資格",
      icon: Award,
    },
    {
      key: "⌥ Alt + S",
      description: "スキル",
      icon: BookOpen,
    },
    {
      key: "⌥ Alt + P",
      description: "プロジェクト",
      icon: FolderKanban,
    },
    {
      key: "⌥ Alt + C",
      description: "連絡先",
      icon: Mail,
    },
  ]

  const formatKey = (key: string) => {
    return key.split(" / ").map((k, i) => (
      <div key={i} className="flex items-center gap-1">
        {k.split(" ").map((part, j) => (
          <span key={j}>
            {part === "⌘" || part === "⌥" || part === "⇧" || part === "⌃" ? (
              <kbd className="pointer-events-none inline-flex h-6 select-none items-center justify-center rounded border bg-muted px-2 font-mono text-xs font-medium">
                {part}
              </kbd>
            ) : (
              <span>{part}</span>
            )}
          </span>
        ))}
      </div>
    ))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            キーボードショートカット
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* グローバルショートカット */}
          <div>
            <h3 className="text-sm font-semibold mb-3">グローバルショートカット</h3>
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {shortcut.icon && <shortcut.icon className="h-5 w-5 text-muted-foreground" />}
                    <span className="text-sm">{shortcut.description}</span>
                  </div>
                  <div className="text-sm font-mono">{formatKey(shortcut.key)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ナビゲーションショートカット */}
          <div>
            <h3 className="text-sm font-semibold mb-3">ナビゲーションショートカット</h3>
            <div className="space-y-2">
              {navigationShortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {shortcut.icon && <shortcut.icon className="h-5 w-5 text-muted-foreground" />}
                    <span className="text-sm">{shortcut.description}</span>
                  </div>
                  <div className="text-sm font-mono">{formatKey(shortcut.key)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ヒント */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">
              💡 <strong>ヒント:</strong> これらのショートカットはどこでも使用できます。
              <br />
              Macの場合は <kbd className="px-1 py-0.5 rounded bg-background border">⌘</kbd>、
              Windows/Linuxの場合は <kbd className="px-1 py-0.5 rounded bg-background border">Ctrl</kbd> キーを使用してください。
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
