import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (!project.isPublic) {
      return NextResponse.json(
        { error: 'Project is not public' },
        { status: 403 }
      )
    }

    // technologiesフィールドをパース
    const projectWithParsedTechnologies = {
      ...project,
      technologies: JSON.parse(project.technologies),
    }

    return NextResponse.json(projectWithParsedTechnologies)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}
