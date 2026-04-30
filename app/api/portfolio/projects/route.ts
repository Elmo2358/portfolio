import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: { isPublic: true },
      orderBy: { displayOrder: 'asc' },
    })

    // technologiesフィールドをパース
    const projectsWithParsedTechnologies = projects.map(project => ({
      ...project,
      technologies: JSON.parse(project.technologies),
    }))

    return NextResponse.json(projectsWithParsedTechnologies)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
