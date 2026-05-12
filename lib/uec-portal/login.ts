import { chromium, type BrowserContext, type Page } from "playwright";
import { saveSession, loadSession, sessionExists, deleteSession } from "./session";
import path from "node:path";
import { writeFile } from "node:fs/promises";

const PORTAL_HOME_URL = "https://portalweb.uec.ac.jp/Portal/u001/index.php";
const PORTAL_TOP_URL = "https://portalweb.uec.ac.jp/Portal/";
const LOGIN_URL = "https://portalweb.uec.ac.jp/Portal/login/login.php?next=";

const PERSISTENT_CONTEXT_DIR = path.join(process.cwd(), ".uec-sessions", "browser-context");
const STORAGE_STATE_FILE = path.join(process.cwd(), ".uec-sessions", "storage-state.json");

export interface LoginCredentials {
  userId: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  message: string;
  requiresTwoFactor?: boolean;
}

/**
 * 手動ログイン（ブラウザを開いてユーザーに操作してもらう）
 * ポータルトップページから開始
 */
export async function manualLogin(): Promise<LoginResult> {
  // 既存のセッションを削除して新規ログイン
  await deleteSession();

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

    // クッキーをクリアしてからポータルトップページへ
    await context.clearCookies();

    console.log("ブラウザを起動しました。");
    console.log("ポータルトップページを開きます...");

    // ポータルトップページを開く（ここからログインフローへ）
    await page.goto(PORTAL_TOP_URL, { waitUntil: "domcontentloaded", timeout: 15000 });

    console.log("\n========== UECポータル ログイン手順 ==========");
    console.log("1. 画面上の「ログイン」ボタンをクリック");
    console.log("2. 統合認証システムでログイン（学籍番号とパスワード）");
    console.log("3. 2段階認証がある場合は完了");
    console.log("4. ポータルトップページが表示されたら完了です");
    console.log("==============================================\n");
    console.log("ログイン完了後、Enterキーを押してください...");
    console.log("(または10分待つと自動的にチェックします)\n");

    // ユーザーがログインするのを待つ
    await waitForUserConfirmation(page);

    // ストレージ状態（クッキー）を保存
    const storageState = await context.storageState();
    await writeFile(STORAGE_STATE_FILE, JSON.stringify(storageState, null, 2), "utf-8");

    // セッションメタデータを保存
    await saveSession(context, "manual");

    console.log("\nログインが確認できました。セッションを保存しました。");
    console.log("ブラウザを閉じます...");

    await context.close();

    return {
      success: true,
      message: "ログインが完了しました。セッションを保存しました。",
    };
  } catch (error) {
    await context.close();
    return {
      success: false,
      message: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * UECポータルにログイン（資格情報入力）
 * 注: 統合認証システムがあるため、手動ログインを推奨
 */
export async function loginToUecPortal(credentials: LoginCredentials): Promise<LoginResult> {
  // 既存のセッションを削除
  await deleteSession();

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

    // クッキーをクリア
    await context.clearCookies();

    // ポータルトップページから開始
    await page.goto(PORTAL_TOP_URL, { waitUntil: "domcontentloaded", timeout: 15000 });

    console.log("ブラウザを起動しました。");
    console.log("ログイン情報を入力します...");

    // 統合認証システムへの遷移を待って入力
    await page.waitForTimeout(2000);

    // ログインフォームを探す
    const useridInput = await page.$('input[name="userid"], input[name="username"], input[id="userid"], input[id="username"]');
    const passwordInput = await page.$('input[name="password"], input[id="password"]');

    if (useridInput && passwordInput) {
      await useridInput.fill(credentials.userId);
      await passwordInput.fill(credentials.password);

      // ログインボタンをクリック
      const submitButton = await page.$('input[type="submit"], button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(5000);
      }
    } else {
      // フォームが見つからない場合は手動入力を待つ
      console.log("ログインフォームが見つかりませんでした。手動で入力してください...");
      await waitForUserConfirmation(page);
    }

    // ログイン完了確認
    await page.goto(PORTAL_HOME_URL, { waitUntil: "domcontentloaded", timeout: 10000 });
    const logoutButton = await page.$("a:has-text('ログアウト')");

    if (logoutButton) {
      // ストレージ状態を保存
      const storageState = await context.storageState();
      await writeFile(STORAGE_STATE_FILE, JSON.stringify(storageState, null, 2), "utf-8");

      await saveSession(context, credentials.userId);
      await context.close();
      return {
        success: true,
        message: "ログインが完了しました。セッションを保存しました。",
      };
    }

    await context.close();
    return {
      success: false,
      message: "ログインに失敗しました。手動ログインを使用してください。",
    };
  } catch (error) {
    await context.close();
    return {
      success: false,
      message: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * ユーザーの確認を待つ（ログイン完了を検知）
 */
async function waitForUserConfirmation(page: Page): Promise<void> {
  // 最大10分待つ
  const deadline = Date.now() + 10 * 60 * 1000;
  let lastCheck = Date.now();

  while (Date.now() < deadline) {
    try {
      // 30秒ごとにチェック
      if (Date.now() - lastCheck > 30000) {
        lastCheck = Date.now();

        // ポータルホームページにアクセスしてログイン確認
        const currentUrl = page.url();

        // 既にポータルホームにいるかチェック
        if (currentUrl.includes("u001") || currentUrl.includes("Portal") && !currentUrl.includes("login")) {
          try {
            await page.goto(PORTAL_HOME_URL, { waitUntil: "domcontentloaded", timeout: 5000 });
            const logoutButton = await page.$("a:has-text('ログアウト')");
            if (logoutButton) {
              console.log("ログインを確認しました。");
              return; // ログイン完了
            }
          } catch {
            // チェック失敗、継続
          }
        }
      }
    } catch {
      // エラーは無視
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // 最終チェック
  try {
    await page.goto(PORTAL_HOME_URL, { waitUntil: "domcontentloaded", timeout: 10000 });
    const logoutButton = await page.$("a:has-text('ログアウト')");
    if (logoutButton) {
      return;
    }
  } catch {
    // 無視
  }

  throw new Error("ログインの確認がタイムアウトしました。");
}

/**
 * ログイン状態を確認
 */
export async function checkLoginStatus(): Promise<boolean> {
  return await sessionExists();
}

/**
 * 保存されたストレージ状態を使用してブラウザコンテキストを作成
 */
export async function createPersistentContext(): Promise<BrowserContext> {
  // 通常のブラウザを起動して、保存されたストレージ状態を読み込む
  const browser = await chromium.launch({
    headless: false,
    args: [
      "--lang=ja",
      "--timezone=Asia/Tokyo",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  // ストレージ状態を読み込む
  let storageState = null;
  try {
    const { readFile } = await import("node:fs/promises");
    const content = await readFile(STORAGE_STATE_FILE, "utf-8");
    storageState = JSON.parse(content);
  } catch {
    // ストレージ状態がない場合は空のオブジェクトを使用
    storageState = { cookies: [], origins: [] };
  }

  const context = await browser.newContext({
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    viewport: { width: 1280, height: 720 },
    storageState,
  });

  return { context, browser };
}
