import dynamic from "next/dynamic"
import { CardListSkeleton } from "@/components/loading/card-skeleton"

const BucketListManager = dynamic(
  () => import("@/components/hub/bucket-list-manager").then(mod => ({ default: mod.BucketListManager })),
  {
    loading: () => <CardListSkeleton count={6} />,
    ssr: false
  }
)

export default function BucketListPage() {
  return (
    <div className="container py-8 animate-fadeIn">
      <BucketListManager />
    </div>
  )
}
