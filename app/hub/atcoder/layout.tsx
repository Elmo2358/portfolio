import { AtCoderNavigation } from "@/components/hub/atcoder/atcoder-navigation"

export default function AtCoderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <AtCoderNavigation />
      {children}
    </div>
  )
}
