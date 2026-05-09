import dynamic from "next/dynamic"
import { CardListSkeleton } from "@/components/loading/card-skeleton"

const FinanceManager = dynamic(
  () => import("@/components/hub/finance-manager").then(mod => ({ default: mod.FinanceManager })),
  {
    loading: () => <CardListSkeleton count={6} />,
    ssr: false
  }
)

export default function FinancePage({
  searchParams
}: {
  searchParams: { type?: string }
}) {
  const initialTab = searchParams.type === "income" ? "income" : searchParams.type === "expense" ? "expense" : "dashboard"

  return (
    <div className="container py-8 animate-fadeIn">
      <FinanceManager initialTab={initialTab} />
    </div>
  )
}
