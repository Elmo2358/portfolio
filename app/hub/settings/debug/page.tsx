import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function DebugSettingsPage() {
  let session = null
  let sessionError = null
  let user = null
  let userError = null

  try {
    session = await getServerSession(authOptions)
  } catch (error) {
    sessionError = error instanceof Error ? error.message : String(error)
  }

  try {
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          name: true,
          notionWikiEnabled: true,
          notionWikiDatabaseId: true,
        },
      })
    }
  } catch (error) {
    userError = error instanceof Error ? error.message : String(error)
  }

  return (
    <div className="container py-6">
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify({
          session: session ? {
            user: {
              email: session.user?.email,
              name: session.user?.name,
            }
          } : null,
          sessionError,
          user,
          userError,
        }, null, 2)}
      </pre>
    </div>
  )
}
