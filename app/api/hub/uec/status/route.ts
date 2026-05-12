import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: UECポータルの同期ステータスを取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        uecPortalEnabled: true,
        uecPortalDataDir: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 同期ログの最新を取得
    const latestSync = await prisma.uecSyncLog.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    // データ数を取得
    const [noticesCount, scheduleCount, timetableCount] = await Promise.all([
      prisma.uecNotice.count({ where: { userId: session.user.id } }),
      prisma.uecScheduleEntry.count({ where: { userId: session.user.id } }),
      prisma.uecTimetableEntry.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      success: true,
      status: {
        enabled: user.uecPortalEnabled,
        dataDir: user.uecPortalDataDir,
        lastSync: latestSync?.createdAt ?? null,
        lastSyncStatus: latestSync?.status ?? null,
        counts: {
          notices: noticesCount,
          schedule: scheduleCount,
          timetable: timetableCount,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching UEC status:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST: UECポータル連携の有効/無効を切り替え
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { enabled, dataDir } = body;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        uecPortalEnabled: enabled,
        uecPortalDataDir: dataDir || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: enabled ? "UECポータル連携を有効にしました" : "UECポータル連携を無効にしました",
    });
  } catch (error) {
    console.error("Error updating UEC settings:", error);
    return NextResponse.json(
      {
        error: "Failed to update settings",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
