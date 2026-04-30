import { FinanceManager } from "@/components/hub/finance-manager"

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
