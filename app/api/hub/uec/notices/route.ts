import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: キャッシュされたお知らせを取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam === "all" ? undefined : parseInt(limitParam || "50");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where: { userId: string; unread?: boolean } = {
      userId: session.user.id,
    };

    if (unreadOnly) {
      where.unread = true;
    }

    const notices = await prisma.uecNotice.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({
      success: true,
      notices,
      count: notices.length,
    });
  } catch (error) {
    console.error("Error fetching UEC notices:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch notices",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
