import { chromium, type BrowserContext } from "playwright";
import { writeFile, readFile, mkdir, access, rm } from "node:fs/promises";
import path from "node:path";

const SESSION_DIR = path.join(process.cwd(), ".uec-sessions");
const SESSION_FILE = path.join(SESSION_DIR, "storage-state.json");
const SESSION_META_FILE = path.join(SESSION_DIR, "session-meta.json");
const PERSISTENT_CONTEXT_DIR = path.join(SESSION_DIR, "browser-context");
const STORAGE_STATE_FILE = path.join(SESSION_DIR, "storage-state.json");

export interface SessionMeta {
  userId: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * セッションディレクトリを確保
 */
export async function ensureSessionDir(): Promise<void> {
  try {
    await access(SESSION_DIR);
  } catch {
    await mkdir(SESSION_DIR, { recursive: true });
  }
}

/**
 * セッションが存在するかチェック
 */
export async function sessionExists(userId?: string): Promise<boolean> {
  try {
    const content = await readFile(STORAGE_STATE_FILE, "utf-8");
    const data = JSON.parse(content);

    // 有効なクッキーが存在するかチェック
    if (!data.cookies || !Array.isArray(data.cookies) || data.cookies.length === 0) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * セッションメタデータを読み込み
 */
export async function readSessionMeta(): Promise<SessionMeta | null> {
  try {
    const content = await readFile(SESSION_META_FILE, "utf-8");
    return JSON.parse(content) as SessionMeta;
  } catch {
    return null;
  }
}

/**
 * セッションメタデータを保存
 */
export async function writeSessionMeta(meta: SessionMeta): Promise<void> {
  await ensureSessionDir();
  await writeFile(SESSION_META_FILE, JSON.stringify(meta, null, 2), "utf-8");
}

/**
 * セッションを保存
 */
export async function saveSession(context: any, userId: string): Promise<void> {
  await ensureSessionDir();

  // メタデータを保存（有効期限: 7日）
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await writeSessionMeta({
    userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
}

/**
 * セッションを読み込み
 */
export async function loadSession(): Promise<object | null> {
  try {
    const content = await readFile(SESSION_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * セッションを完全に削除
 */
export async function deleteSession(): Promise<void> {
  try {
    // 永続コンテキストディレクトリを削除
    await rm(PERSISTENT_CONTEXT_DIR, { recursive: true, force: true }).catch(() => {});

    // ストレージ状態ファイルを削除
    await rm(STORAGE_STATE_FILE, { force: true }).catch(() => {});

    // セッションファイルを削除
    await writeFile(SESSION_FILE, "{}", "utf-8").catch(() => {});
    await writeFile(SESSION_META_FILE, "{}", "utf-8").catch(() => {});
  } catch {
    // 無視
  }
}

/**
 * セッションを使用してブラウザコンテキストを作成
 */
export async function createContextWithSession(): Promise<BrowserContext> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--lang=ja",
      "--timezone=Asia/Tokyo",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  const storageState = await loadSession();
  const context = await browser.newContext({
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    viewport: { width: 1280, height: 720 },
    storageState: storageState || undefined,
  });

  return context;
}
