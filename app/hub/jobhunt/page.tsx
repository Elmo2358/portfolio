import dynamic from "next/dynamic"
import { CardListSkeleton } from "@/components/loading/card-skeleton"

const JobHuntManager = dynamic(
  () => import("@/components/hub/jobhunt-manager").then(mod => ({ default: mod.JobHuntManager })),
  {
    loading: () => <CardListSkeleton count={6} />,
    ssr: false
  }
)

export default function JobHuntPage() {
  return (
    <div className="container py-8 animate-fadeIn">
      <JobHuntManager />
    </div>
  )
}
