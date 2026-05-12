import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

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

export type UecCliResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const PORTAL_HOME_URL = "https://portalweb.uec.ac.jp/Portal/u001/index.php";
const PORTAL_LOGIN_URL = "https://portalweb.uec.ac.jp/Portal/login/login.php?next=";
const PORTAL_NOTICE_URL = "https://portalweb.uec.ac.jp/Portal/u008/noticeTop.php";
const PORTAL_SCHEDULE_URL = "https://portalweb.uec.ac.jp/Portal/u009/scheduleTop.php";
const PORTAL_TIMETABLE_URL = "https://portalweb.uec.ac.jp/Portal/u004/lecture.php";

// セッション保存用ディレクトリ
const SESSION_DIR = path.join(process.cwd(), ".uec-sessions");

async function ensureSessionDir() {
  await mkdtemp(SESSION_DIR).catch(() => {});
}

/**
 * UECポータル用ブラウザを起動
 */
async function launchUecBrowser(): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  await ensureSessionDir();

  // 一時的なユーザーデータディレクトリを作成
  const profileDir = await mkdtemp(path.join(os.tmpdir(), "uec-portal-"));

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--lang=ja",
      "--timezone=Asia/Tokyo",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  const context = await browser.newContext({
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  return { browser, context, page };
}

/**
 * ページがログイン済みか確認
 */
async function isAuthenticatedPage(page: Page): Promise<boolean> {
  try {
    await page.goto(PORTAL_HOME_URL, { waitUntil: "domcontentloaded", timeout: 10000 });

    // ログインページにリダイレクトされるかチェック
    const currentUrl = page.url();
    if (currentUrl.includes("login")) {
      return false;
    }

    // ログアウトボタンが存在するかチェック
    const logoutButton = await page.$("a:has-text('ログアウト')");
    return !!logoutButton;
  } catch {
    return false;
  }
}

/**
 * UECポータルからお知らせを抽出
 */
async function extractNotices(page: Page, limit: number): Promise<UecNotice[]> {
  await page.goto(PORTAL_HOME_URL, { waitUntil: "domcontentloaded", timeout: 15000 });

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
 * UECポータルから予定を抽出
 */
async function extractSchedule(page: Page, limit: number): Promise<UecScheduleEntry[]> {
  await page.goto(PORTAL_SCHEDULE_URL, { waitUntil: "domcontentloaded", timeout: 15000 });

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
 * UECポータルから時間割を抽出
 */
async function extractTimetable(page: Page): Promise<UecTimetableEntry[]> {
  await page.goto(PORTAL_TIMETABLE_URL, { waitUntil: "domcontentloaded", timeout: 15000 });

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
