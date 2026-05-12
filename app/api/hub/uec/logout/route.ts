import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteSession } from "@/lib/uec-portal/session";
import { rm } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".uec-sessions", "data");

// POST: UECポータルからログアウト
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // セッションを削除
    await deleteSession();

    // JSONファイルも削除
    try {
      await rm(path.join(DATA_DIR, "notices.json"), { force: true });
      await rm(path.join(DATA_DIR, "schedule.json"), { force: true });
      await rm(path.join(DATA_DIR, "timetable.json"), { force: true });
    } catch {
      // 削除エラーは無視
    }

    return NextResponse.json({
      success: true,
      message: "ログアウトしました。セッションとデータを削除しました。",
    });
  } catch (error) {
    console.error("Error logging out from UEC portal:", error);
    return NextResponse.json(
      {
        error: "Failed to logout",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
