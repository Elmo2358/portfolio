import dynamic from "next/dynamic"
import { CardListSkeleton } from "@/components/loading/card-skeleton"

const TasksManager = dynamic(
  () => import("@/components/hub/tasks-manager").then(mod => ({ default: mod.TasksManager })),
  {
    loading: () => <CardListSkeleton count={6} />,
    ssr: false
  }
)

export default function TasksPage() {
  return (
    <div className="container py-8 animate-fadeIn">
      <TasksManager />
    </div>
  )
}
