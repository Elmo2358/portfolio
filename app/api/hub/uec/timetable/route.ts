import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: キャッシュされた時間割を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const timetable = await prisma.uecTimetableEntry.findMany({
      where: { userId: session.user.id },
      orderBy: [{ day: "asc" }, { period: "asc" }],
    });

    // 曜日順にソート
    const dayOrder = ["月", "火", "水", "木", "金", "土", "日"];
    timetable.sort((a, b) => {
      const dayIndexA = dayOrder.indexOf(a.day);
      const dayIndexB = dayOrder.indexOf(b.day);
      if (dayIndexA !== dayIndexB) {
        return dayIndexA - dayIndexB;
      }
      return parseInt(a.period) - parseInt(b.period);
    });

    return NextResponse.json({
      success: true,
      timetable,
      count: timetable.length,
    });
  } catch (error) {
    console.error("Error fetching UEC timetable:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch timetable",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
