"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, BookOpen, Trophy, FileText } from "lucide-react"

const navItems = [
  {
    href: "/hub/atcoder/problems",
    label: "問題・統計",
    icon: BarChart3,
  },
  {
    href: "/hub/atcoder/learning",
    label: "学習・推薦",
    icon: BookOpen,
  },
  {
    href: "/hub/atcoder/contests",
    label: "コンテスト",
    icon: Trophy,
  },
  {
    href: "/hub/atcoder/reviews",
    label: "レビュー",
    icon: FileText,
  },
]

export function AtCoderNavigation() {
  const pathname = usePathname()

  return (
    <div className="border-b">
      <nav className="flex overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                isActive
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
