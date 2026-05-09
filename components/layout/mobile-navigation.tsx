"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Home, User, Award, BookOpen, FolderKanban, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/about", label: "自己紹介", icon: User },
  { href: "/qualifications", label: "資格", icon: Award },
  { href: "/skills", label: "スキル", icon: BookOpen },
  { href: "/projects", label: "プロジェクト", icon: FolderKanban },
  { href: "/contact", label: "連絡先", icon: Mail },
]

export function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden touch-manipulation"
          aria-label="メニューを開く"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-80 p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center gap-2">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              Portfolio
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">ナビゲーションメニュー</SheetDescription>
        </SheetHeader>

        <nav className="flex flex-col p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium
                  touch-manipulation transition-all active:scale-95
                  ${
                    isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground text-center">
            スワイプして閉じる
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
