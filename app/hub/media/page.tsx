import dynamic from "next/dynamic"
import { CardListSkeleton } from "@/components/loading/card-skeleton"

const MediaManager = dynamic(
  () => import("@/components/hub/media-manager").then(mod => ({ default: mod.MediaManager })),
  {
    loading: () => <CardListSkeleton count={6} />,
    ssr: false
  }
)

export default function MediaPage() {
  return (
    <div className="container py-8 animate-fadeIn">
      <MediaManager />
    </div>
  )
}
