import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const internships = await prisma.internship.findMany({
      where: { isPublic: true },
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json(internships)
  } catch (error) {
    console.error('Error fetching internships:', error)
    return NextResponse.json(
      { error: 'Failed to fetch internships' },
      { status: 500 }
    )
  }
}
