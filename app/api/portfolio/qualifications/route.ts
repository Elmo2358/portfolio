import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const qualifications = await prisma.qualification.findMany({
      where: { isPublic: true },
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json(qualifications)
  } catch (error) {
    console.error('Error fetching qualifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch qualifications' },
      { status: 500 }
    )
  }
}
