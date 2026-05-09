import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  return NextResponse.json({
    sessionEmail: session?.user?.email || null,
    userName: session?.user?.name || null,
    userId: session?.user?.id || null,
    allUsers: users,
  })
}
