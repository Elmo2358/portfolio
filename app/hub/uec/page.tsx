"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap } from "lucide-react"
import dynamic from "next/dynamic"
import { CardListSkeleton } from "@/components/loading/card-skeleton"

// UecPortalManagerを動的インポート
const UecPortalManager = dynamic(
  () => import("@/components/hub/uec-portal-manager").then(mod => ({ default: mod.UecPortalManager })),
  {
    loading: () => <CardListSkeleton count={4} />,
    ssr: false
  }
)

export default function UecPortalPage() {
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-emerald-600 dark:bg-emerald-500">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                UECポータル
              </h1>
              <p className="text-muted-foreground">
                大学からのお知らせ・予定・時間割を確認
              </p>
            </div>
          </div>
        </div>

        <UecPortalManager />
      </div>
    </div>
  )
}
