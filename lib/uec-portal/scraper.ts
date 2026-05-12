import { chromium, type Page } from "playwright";
import path from "node:path";
import { readFile } from "node:fs/promises";

const PORTAL_HOME_URL = "https://portalweb.uec.ac.jp/Portal/u001/index.php";
const PORTAL_NOTICE_URL = "https://portalweb.uec.ac.jp/Portal/u008/noticeTop.php";
const PORTAL_SCHEDULE_URL = "https://portalweb.uec.ac.jp/Portal/u009/scheduleTop.php";
const PORTAL_TIMETABLE_URL = "https://portalweb.uec.ac.jp/Portal/u004/lecture.php";
const STORAGE_STATE_FILE = path.join(process.cwd(), ".uec-sessions", "storage-state.json");
const PERSISTENT_CONTEXT_DIR = path.join(process.cwd(), ".uec-sessions", "browser-context");

export type UecNotice = {
  category?: string;
  date?: string;
  href?: string;
  publisher?: string;
  rawText: string;
  title: string;
  unread: boolean;
};

export type UecScheduleEntry = {
  dateLabel: string;
  rawText: string;
  time?: string;
  title: string;
  weekday: string;
};

export type UecTimetableEntry = {
  courseCode?: string;
  day: string;
  period: string;
  rawText: string;
  room?: string;
  title: string;
};

/**
 * ページ移動のヘルパー（リトライ付き）
 */
async function navigateToPage(page: Page, url: string, maxRetries = 3): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      // 追加: ページが完全に読み込まれるまで待つ
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      // 少し待ってからリトライ
      await page.waitForTimeout(1000);
    }
  }
  return false;
}

/**
 * お知らせを抽出
 */
export async function extractNotices(page: Page, limit: number): Promise<UecNotice[]> {
  await navigateToPage(page, PORTAL_HOME_URL);
  await page.waitForTimeout(1000); // ページが安定するまで待つ

  return await page.evaluate((maxItems) => {
    const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
    const rows = Array.from(document.querySelectorAll("table.u001_table_info2 tr"));

    return rows
      .map((row) => {
        const rawText = normalize(row.textContent ?? "");
        if (!rawText.includes("掲載日")) {
          return undefined;
        }

        const titleAnchor = Array.from(row.querySelectorAll("a[href]"))
          .map((anchor) => ({
            href: (anchor as HTMLAnchorElement).href,
            text: normalize(anchor.textContent ?? ""),
          }))
          .find((anchor) => anchor.text && !["続きはこちら", "一時保存"].includes(anchor.text));

        const date = rawText.match(/掲載日\s*([0-9./-]+)/)?.[1];
        const title = titleAnchor?.text ?? normalize(rawText.replace(/^掲載日\s*[0-9./-]+\s*/, ""));
        const publisher =
          titleAnchor && rawText.includes("掲載者")
            ? normalize(rawText.split("掲載者")[1]?.split(titleAnchor.text)[0] ?? "")
            : undefined;
        const category = rawText.match(/\(([^()]+)\)\s*$/)?.[1];

        return {
          category,
          date,
          href: titleAnchor?.href,
          publisher: publisher || undefined,
          rawText,
          title,
          unread: rawText.includes("[未読]"),
        };
      })
      .filter((notice): notice is NonNullable<typeof notice> => Boolean(notice))
      .slice(0, maxItems);
  }, limit);
}

/**
 * 予定を抽出
 */
export async function extractSchedule(page: Page, limit: number): Promise<UecScheduleEntry[]> {
  await navigateToPage(page, PORTAL_SCHEDULE_URL);
  await page.waitForTimeout(1000); // ページが安定するまで待つ

  return await page.evaluate((maxItems) => {
    const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

    function parseEntry(dateLabel: string, weekday: string, rawText: string) {
      const match = rawText.match(/^(\d{1,2}:\d{2}[～~-]\d{1,2}:\d{2})\s*(.*)$/);
      return {
        dateLabel,
        rawText,
        time: match?.[1],
        title: normalize(match?.[2] ?? rawText),
        weekday,
      };
    }

    const table = document.querySelector("table.u009_table_schedule");
    if (!table) {
      return [];
    }

    const rows = Array.from(table.querySelectorAll("tr"));
    const weekdays = Array.from(rows[0]?.querySelectorAll("th,td") ?? []).map((cell) =>
      normalize(cell.textContent ?? ""),
    );
    const dateLabels = Array.from(rows[1]?.querySelectorAll("th,td") ?? []).map((cell) =>
      normalize(cell.textContent ?? ""),
    );
    const eventCells = Array.from(rows[2]?.querySelectorAll("th,td") ?? []);

    const entries = eventCells.flatMap((cell, index) => {
      const anchors = Array.from(cell.querySelectorAll("a")).map((anchor) =>
        normalize(anchor.textContent ?? ""),
      );
      const rawItems = anchors.length > 0 ? anchors : splitScheduleText(normalize(cell.textContent ?? ""));

      return rawItems
        .filter(Boolean)
        .map((rawText) => parseEntry(dateLabels[index] ?? "", weekdays[index] ?? "", rawText));
    });

    return entries.slice(0, maxItems);

    function splitScheduleText(text: string): string[] {
      if (!text) {
        return [];
      }

      const matches = Array.from(text.matchAll(/\d{1,2}:\d{2}[～~-]\d{1,2}:\d{2}/g));
      if (matches.length <= 1) {
        return [text];
      }

      return matches.map((match, index) => {
        const start = match.index ?? 0;
        const end = matches[index + 1]?.index ?? text.length;
        return normalize(text.slice(start, end));
      });
    }
  }, limit);
}

/**
 * 時間割を抽出
 */
export async function extractTimetable(page: Page): Promise<UecTimetableEntry[]> {
  await navigateToPage(page, PORTAL_TIMETABLE_URL);
  await page.waitForTimeout(1000); // ページが安定するまで待つ

  return await page.evaluate(() => {
    const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
    const table = document.querySelector("table.u004_table_jikanwari");
    if (!table) {
      return [];
    }

    const rows = Array.from(table.querySelectorAll("tr"));
    const days = Array.from(rows[0]?.querySelectorAll("th,td") ?? [])
      .map((cell) => normalize(cell.textContent ?? ""))
      .slice(1);

    return rows.slice(1).flatMap((row) => {
      const cells = Array.from(row.querySelectorAll("th,td"));
      const period = normalize(cells[0]?.textContent ?? "");

      return cells.slice(1).flatMap((cell, index) => {
        const rawText = normalize(cell.textContent ?? "");
        if (!rawText) {
          return [];
        }

        const anchorText = normalize(cell.querySelector("a")?.textContent ?? "");
        const courseMatch = (anchorText || rawText).match(/^\[([^\]]+)\](.+)$/);
        const courseCode = courseMatch?.[1];
        const title = normalize(courseMatch?.[2] ?? (anchorText || rawText));
        const room = anchorText && rawText.startsWith(anchorText) ? normalize(rawText.slice(anchorText.length)) : undefined;

        return [
          {
            courseCode,
            day: days[index] ?? "",
            period,
            rawText,
            room: room || undefined,
            title,
          },
        ];
      });
    });
  });
}

/**
 * ログイン状態を確認
 */
async function isAuthenticatedPage(page: Page): Promise<boolean> {
  try {
    // まずトップページへ
    await page.goto("https://portalweb.uec.ac.jp/Portal/", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1000); // ページが安定するまで待つ

    // ログアウトボタンが存在するかチェック
    const logoutButton = await page.$("a:has-text('ログアウト'), button:has-text('ログアウト')");
    if (logoutButton) {
      return true;
    }

    // ホームページへ移動してみる
    await page.goto(PORTAL_HOME_URL, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1000); // ページが安定するまで待つ

    // ログインページにリダイレクトされるかチェック
    const currentUrl = page.url();
    if (currentUrl.includes("login")) {
      return false;
    }

    // 再度ログアウトボタンをチェック
    const logoutButton2 = await page.$("a:has-text('ログアウト'), button:has-text('ログアウト')");
    if (logoutButton2) {
      return true;
    }

    // 最終チェック: ページのコンテンツを確認
    const pageText = await page.textContent("body");
    return !!pageText && !pageText.includes("ログインしてください") && !pageText.includes("Login Required");
  } catch {
    return false;
  }
}

/**
 * 全データを取得（保存されたブラウザコンテキストを使用）
 */
export async function fetchAllUecData(): Promise<{
  success: boolean;
  notices?: UecNotice[];
  schedule?: UecScheduleEntry[];
  timetable?: UecTimetableEntry[];
  error?: string;
}> {
  // ストレージ状態を読み込んでチェック
  try {
    const content = await readFile(STORAGE_STATE_FILE, "utf-8");
    const data = JSON.parse(content);

    // 有効なクッキーが存在するかチェック
    if (!data.cookies || !Array.isArray(data.cookies) || data.cookies.length === 0) {
      return {
        success: false,
        error: "セッションがありません。先にログインしてください。",
      };
    }
  } catch {
    return {
      success: false,
      error: "セッションがありません。先にログインしてください。",
    };
  }

  // 永続的なブラウザコンテキストを使用（ログイン時に使用したものと同じディレクトリ）
  const context = await chromium.launchPersistentContext(PERSISTENT_CONTEXT_DIR, {
    headless: false,
    args: [
      "--lang=ja",
      "--timezone=Asia/Tokyo",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    viewport: { width: 1280, height: 720 },
  });

  try {
    const page = context.pages()[0] || await context.newPage();

    // ログイン状態チェック
    if (!(await isAuthenticatedPage(page))) {
      await context.close();
      return {
        success: false,
        error: "セッションの有効期限が切れています。再度ログインしてください。",
      };
    }

    // データを取得
    const [notices, schedule, timetable] = await Promise.all([
      extractNotices(page, 50),
      extractSchedule(page, 50),
      extractTimetable(page),
    ]);

    await context.close();

    return {
      success: true,
      notices,
      schedule,
      timetable,
    };
  } catch (error) {
    await context.close();
    return {
      success: false,
      error: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
