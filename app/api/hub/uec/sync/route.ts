import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile, access } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".uec-sessions", "data");

// 保存されたJSONファイルからデータを読み込む
async function loadJsonFile(filename: string): Promise<any> {
  try {
    const filePath = path.join(DATA_DIR, filename);
    await access(filePath);
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// POST: UECポータルデータを同期（保存されたJSONファイルから）
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();

    // ユーザーのUEC連携が有効か確認
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { uecPortalEnabled: true },
    });

    if (!user?.uecPortalEnabled) {
      return NextResponse.json(
        { error: "UECポータル連携が有効ではありません。設定画面から有効にしてください。" },
        { status: 400 }
      );
    }

    // 保存されたJSONファイルからデータを読み込む
    const [notices, schedule, timetable] = await Promise.all([
      loadJsonFile("notices.json"),
      loadJsonFile("schedule.json"),
      loadJsonFile("timetable.json"),
    ]);

    const syncDuration = Date.now() - startTime;

    // データが存在するか確認
    if (!notices && !schedule && !timetable) {
      return NextResponse.json({
        success: false,
        error: "データがありません。先に 'npm run uec:sync' を実行してください。",
      });
    }

    // お知らせを保存
    let noticesCount = 0;
    if (notices && Array.isArray(notices)) {
      await prisma.uecNotice.deleteMany({
        where: { userId: session.user.id },
      });

      for (const notice of notices) {
        await prisma.uecNotice.create({
          data: {
            userId: session.user.id,
            title: notice.title,
            date: notice.date,
            publisher: notice.publisher,
            category: notice.category,
            href: notice.href,
            rawText: notice.rawText,
            unread: notice.unread,
            detailHtml: notice.detailHtml,
            detailText: notice.detailText,
          },
        });
        noticesCount++;
      }
    }

    // 予定を保存
    let scheduleCount = 0;
    if (schedule && Array.isArray(schedule)) {
      await prisma.uecScheduleEntry.deleteMany({
        where: { userId: session.user.id },
      });

      for (const entry of schedule) {
        await prisma.uecScheduleEntry.create({
          data: {
            userId: session.user.id,
            dateLabel: entry.dateLabel,
            weekday: entry.weekday,
            time: entry.time,
            title: entry.title,
            rawText: entry.rawText,
          },
        });
        scheduleCount++;
      }
    }

    // 時間割を保存
    let timetableCount = 0;
    if (timetable && Array.isArray(timetable)) {
      await prisma.uecTimetableEntry.deleteMany({
        where: { userId: session.user.id },
      });

      for (const entry of timetable) {
        await prisma.uecTimetableEntry.create({
          data: {
            userId: session.user.id,
            day: entry.day,
            period: entry.period,
            title: entry.title,
            courseCode: entry.courseCode,
            room: entry.room,
            rawText: entry.rawText,
          },
        });
        timetableCount++;
      }
    }

    // 同期ログを保存
    await prisma.uecSyncLog.create({
      data: {
        userId: session.user.id,
        dataType: "all",
        status: "success",
        itemCount: noticesCount + scheduleCount + timetableCount,
        syncDuration,
      },
    });

    return NextResponse.json({
      success: true,
      message: "UECポータルデータの同期が完了しました",
      stats: {
        noticesCount,
        scheduleCount,
        timetableCount,
        syncDuration,
      },
    });
  } catch (error) {
    console.error("Error syncing UEC portal data:", error);

    // エラーログを保存
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        await prisma.uecSyncLog.create({
          data: {
            userId: session.user.id,
            dataType: "all",
            status: "error",
            errorMessage: error instanceof Error ? error.message : String(error),
          },
        }).catch(() => {});
      }
    } catch {
      // 無視
    }

    return NextResponse.json(
      {
        error: "Failed to sync UEC portal data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
