import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { access } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".uec-sessions", "data");

// GET: ログイン状態を確認（JSONファイルが存在するかチェック）
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ユーザーのUEC連携が有効か確認
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { uecPortalEnabled: true },
    });

    if (!user?.uecPortalEnabled) {
      return NextResponse.json({
        success: true,
        isLoggedIn: false,
      });
    }

    // JSONファイルが存在するかチェック
    try {
      await access(path.join(DATA_DIR, "notices.json"));
      await access(path.join(DATA_DIR, "schedule.json"));
      await access(path.join(DATA_DIR, "timetable.json"));
      return NextResponse.json({
        success: true,
        isLoggedIn: true,
      });
    } catch {
      return NextResponse.json({
        success: true,
        isLoggedIn: false,
      });
    }
  } catch (error) {
    console.error("Error checking login status:", error);
    return NextResponse.json(
      {
        error: "Failed to check login status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST: 使用不可（CLIでの同期を案内）
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error: "Webからのログインはサポートされていません",
      message: "CLIで 'npm run uec:sync' を実行してください",
    },
    { status: 400 }
  );
}
