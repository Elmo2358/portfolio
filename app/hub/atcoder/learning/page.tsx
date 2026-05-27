import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AtCoderLearningClient } from "./client"
import { BookOpen } from "lucide-react"

export default async function AtCoderLearningPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/api/auth/signin")
  }

  return <AtCoderLearningClient />
}
