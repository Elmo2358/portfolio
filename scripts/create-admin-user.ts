import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // 既存のユーザーを確認
  const existingUsers = await prisma.user.findMany()
  console.log("Existing users:", existingUsers.map(u => ({ id: u.id, email: u.email, name: u.name })))

  // admin@portfolio.local が存在しない場合は作成
  const adminEmail = "admin@portfolio.local"
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existing) {
    console.log("User already exists:", adminEmail)
  } else {
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Elmo",
      }
    })
    console.log("Created user:", user)
  }

  // 全ユーザーを再確認
  const allUsers = await prisma.user.findMany()
  console.log("All users:", allUsers.map(u => ({ id: u.id, email: u.email, name: u.name })))
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
