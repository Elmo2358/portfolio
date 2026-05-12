import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: キャッシュされた予定を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const schedule = await prisma.uecScheduleEntry.findMany({
      where: { userId: session.user.id },
      orderBy: [{ dateLabel: "asc" }, { time: "asc" }],
      take: limit,
    });

    return NextResponse.json({
      success: true,
      schedule,
      count: schedule.length,
    });
  } catch (error) {
    console.error("Error fetching UEC schedule:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch schedule",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
