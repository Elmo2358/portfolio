#!/usr/bin/env node
/**
 * UECポータル同期コマンド
 *
 * ログインとデータ取得を1つのプロセスで実行します
 */
const { chromium } = require("playwright");
const path = require("node:path");
const { writeFile, mkdir, access } = require("node:fs/promises");
const readline = require("node:readline");

const PERSISTENT_CONTEXT_DIR = path.join(process.cwd(), ".uec-sessions", "browser-context");
const DATA_DIR = path.join(process.cwd(), ".uec-sessions", "data");
const PORTAL_TOP_URL = "https://portalweb.uec.ac.jp/Portal/";
const PORTAL_HOME_URL = "https://portalweb.uec.ac.jp/Portal/u001/index.php";
const PORTAL_SCHEDULE_URL = "https://portalweb.uec.ac.jp/Portal/u009/scheduleTop.php";
const PORTAL_TIMETABLE_URL = "https://portalweb.uec.ac.jp/Portal/u004/lecture.php";
const PORTAL_NOTICES_URL = "https://portalweb.uec.ac.jp/Portal/u008/noticeTop.php";
const PORTAL_NOTICE_DETAIL_URL = "https://portalweb.uec.ac.jp/Portal/u008/noticeDetail.php";

async function ensureDataDir() {
  try {
    await access(DATA_DIR);
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function main() {
  console.log("\n=== UECポータル 同期ツール ===\n");

  // 永続的なブラウザコンテキストを起動
  console.log("🌐 ブラウザを起動しています...");

  const context = await chromium.launchPersistentContext(PERSISTENT_CONTEXT_DIR, {
    headless: false,
    args: [
      "--lang=ja",
      "--timezone=Asia/Tokyo",
    ],
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    viewport: { width: 1280, height: 720 },
  });

  const page = context.pages()[0] || await context.newPage();

  // ポータルページを開く
  console.log("ポータルページを開いています...");
  await page.goto(PORTAL_TOP_URL, { waitUntil: "domcontentloaded", timeout: 20000 });

  // ログインを待つ（ユーザーが自分でブラウザを操作してログイン）
  console.log("\n========== UECポータル ログインが必要です ==========");
  console.log("1. 画面上の「ログイン」ボタンをクリック");
  console.log("2. 統合認証システムでログイン（学籍番号とパスワード）");
  console.log("3. 2段階認証がある場合は完了");
  console.log("4. ログイン完了後、ターミナルに戻ってEnterキーを押してください");
  console.log("====================================================\n");

  // ユーザーがログインするのを待つ
  await waitForUserConfirmation(page);

  // データを取得
  console.log("\n📥 データを取得しています...");

  let notices = await extractNotices(page);
  console.log("   ✅ お知らせ一覧: " + notices.length + "件");

  // お知らせの詳細を取得
  if (notices.length > 0) {
    console.log("   📝 お知らせの詳細を取得しています...");
    notices = await fetchNoticeDetails(page, notices);
    console.log("   ✅ お知らせ詳細取得完了: " + notices.length + "件");
  }

  const schedule = await extractSchedule(page);
  console.log("   ✅ 予定: " + schedule.length + "件");

  const timetable = await extractTimetable(page);
  console.log("   ✅ 時間割: " + timetable.length + "件");

  // データを保存
  await ensureDataDir();
  await writeFile(path.join(DATA_DIR, "notices.json"), JSON.stringify(notices, null, 2), "utf-8");
  await writeFile(path.join(DATA_DIR, "schedule.json"), JSON.stringify(schedule, null, 2), "utf-8");
  await writeFile(path.join(DATA_DIR, "timetable.json"), JSON.stringify(timetable, null, 2), "utf-8");

  console.log("\n✅ データを保存しました:");
  console.log("   - " + path.join(DATA_DIR, "notices.json"));
  console.log("   - " + path.join(DATA_DIR, "schedule.json"));
  console.log("   - " + path.join(DATA_DIR, "timetable.json"));

  console.log("\nブラウザを閉じます...");
  await context.close();

  console.log("\n✅ 同期が完了しました！\n");
}

async function waitForUserConfirmation(page) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    console.log("\nログイン完了後、Enterキーを押してください...");

    // 10分後にタイムアウト
    const timeout = setTimeout(() => {
      rl.close();
      reject(new Error("ログインの確認がタイムアウトしました。"));
    }, 10 * 60 * 1000);

    rl.question("", async () => {
      clearTimeout(timeout);
      rl.close();

      try {
        // ホームページでログインを確認
        await page.goto(PORTAL_HOME_URL, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(1000);

        // ログイン済みの場合、ホームページのコンテンツが表示される
        // ログインしていない場合、ログインページにリダイレクトされる
        const currentUrl = page.url();
        const isLoginPage = currentUrl.includes("login") || currentUrl.includes("Login");

        // ログインボタンもチェック
        const loginBtn = await page.$("a[href*='login.php'], img[alt='Login']");

        // ホームページのメニューが存在するかもチェック
        const hasMenu = await page.$(".global-menu, .header-menu, nav").then(el => !!el).catch(() => false);

        // ページのタイトルもチェック
        const title = await page.title().catch(() => "");

        console.log("ログイン状態のデバッグ情報:");
        console.log("  現在のURL: " + currentUrl);
        console.log("  ページタイトル: " + title);
        console.log("  ログインページ: " + isLoginPage);
        console.log("  ログインボタン有: " + !!loginBtn);
        console.log("  メニュー有: " + hasMenu);

        // ホームページにアクセスできていればログイン済みとみなす
        if (!isLoginPage && !loginBtn && (hasMenu || currentUrl.includes("u001"))) {
          console.log("✅ ログインを確認しました。\n");
          resolve();
        } else {
          reject(new Error("まだログインされていません。再度ログインしてください。"));
        }
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function extractNotices(page) {
  // noticeTop.phpからカテゴリ別に取得
  await page.goto(PORTAL_NOTICES_URL, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(3000);

  // ページ読み込み完了まで待機
  await page.waitForSelector("#div_list", { timeout: 10000 }).catch(() => {});

  const allNotices = [];
  // ID+カテゴリの組み合わせで重複チェック
  const seenIdCategories = new Set();

  // 左側のカテゴリツリーを取得
  console.log("   カテゴリツリーを取得しています...");

  // まず、カテゴリリンクの要素情報を取得
  const categoryLinksInfo = await page.evaluate(() => {
    const links = [];
    // ツリー内のすべてのリンクを取得
    const allLinks = document.querySelectorAll("a[onclick*='getNoticeList'], a[href*='javascript:getNoticeList']");

    allLinks.forEach((link, index) => {
      const text = link.textContent?.trim() || "";
      const onclick = link.getAttribute("onclick") || link.getAttribute("href") || "";

      // 重複を避けるためにユニークなテキストのみを取得
      if (text && !links.find(l => l.text === text)) {
        links.push({
          text,
          index,
          onclick
        });
      }
    });

    return links;
  });

  console.log("   見つかったカテゴリ: " + categoryLinksInfo.length + "件");

  // 各カテゴリをクリックしてお知らせを取得
  for (const catInfo of categoryLinksInfo) {
    console.log("   カテゴリ: " + catInfo.text);

    try {
      // カテゴリリンクをクリック
      const links = await page.$$("a[onclick*='getNoticeList'], a[href*='javascript:getNoticeList']");

      // テキストが一致するリンクを探してクリック
      let clicked = false;
      for (const link of links) {
        try {
          const text = await link.textContent();
          if (text && text.trim() === catInfo.text) {
            // 要素が見えるか確認
            const isVisible = await link.isVisible().catch(() => false);
            if (isVisible) {
              await link.click();
              clicked = true;
              break;
            } else {
              console.log("   警告: リンクが見えません");
            }
          }
        } catch (e) {
          // リンクごとのエラーは無視
        }
      }

      if (!clicked) {
        console.log("   警告: クリックできませんでした");
        continue;
      }

      // コンテンツが読み込まれるのを待つ
      await page.waitForTimeout(3000);

      // お知らせを抽出（カテゴリ名を渡す）
      const notices = await extractNoticesFromCurrentPage(page, catInfo.text);

      console.log("   ✅ " + catInfo.text + ": " + notices.length + "件");

      // 重複を排除して追加（IDとカテゴリの組み合わせでチェック）
      for (const notice of notices) {
        const idCategoryKey = notice.id + ":" + catInfo.text;
        if (!seenIdCategories.has(idCategoryKey)) {
          seenIdCategories.add(idCategoryKey);
          allNotices.push(notice);
        }
      }
    } catch (e) {
      console.log("   カテゴリ取得エラー: " + catInfo.text + " - " + e.message);
    }
  }

  console.log("   合計: " + allNotices.length + "件");
  return allNotices;
}

// 現在のページからお知らせを抽出
async function extractNoticesFromCurrentPage(page, categoryName) {
  const results = [];

  try {
    const notices = await page.evaluate(() => {
      const items = [];
      const divList = document.getElementById("div_list");

      if (divList) {
        // すべてのリンクを取得（hrefにjavascript:が含まれるもの）
        const titleLinks = divList.querySelectorAll("a[href^='javascript:']");

        titleLinks.forEach(link => {
          // hrefを取得（改行とスペースを削除）
          let href = link.getAttribute("href") || "";
          href = href.replace(/\s+/g, ""); // すべての空白文字を削除

          // hrefからIDを抽出（openWin(8326,1)のような形式）
          let idMatch = href.match(/openWin\((\d+)/);

          if (idMatch) {
            const title = link.textContent?.trim() || "";
            const row = link.closest("tr");

            let publisher = "";
            let startDate = null;

            if (row) {
              const nameCell = row.querySelector(".th_name");
              if (nameCell) publisher = nameCell.textContent?.trim() || "";

              const dateCells = row.querySelectorAll(".th_date");
              dateCells.forEach((cell) => {
                const text = cell.textContent?.trim() || "";
                if (text.includes("開始日")) {
                  startDate = text.replace("開始日", "").trim();
                }
              });
            }

            items.push({
              id: idMatch[1],
              title,
              publisher,
              date: startDate
            });
          }
        });
      }

      return items;
    });

    results.push(...notices);
  } catch (e) {
    console.log("   抽出エラー: " + e.message);
  }

  return results.map(n => ({
    id: n.id,
    title: n.title,
    category: categoryName, // 渡されたカテゴリ名を使用
    publisher: n.publisher || undefined,
    date: n.date || undefined,
    href: null,
    rawText: n.title,
    unread: false,
    detailHtml: null,
    detailText: null
  }));
}

async function extractNoticesFromTable(table) {
  const results = [];

  // テーブル内の行を取得
  const rows = await table.$$("tr");

  // 最初の行はヘッダーなのでスキップ
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // セルを取得
    const cells = await row.$$("td, th");

    // セル数が少ない場合、行全体を1つのセルとして扱う
    if (cells.length === 1) {
      const cell = cells[0];
      const cellHtml = await cell.innerHTML();
      const cellText = await cell.textContent();
      const normalized = cellText ? cellText.replace(/\s+/g, " ").trim() : "";

      // 日付を抽出（def_dateクラスのspan）
      let date = undefined;
      const dateElem = await cell.$("span.def_date");
      if (dateElem) {
        const dateText = await dateElem.textContent();
        if (dateText) {
          date = dateText.replace(/\s+/g, " ").trim();
        }
      }

      // 掲載者を抽出（pタグ内のテキストから）
      let publisher = undefined;
      const pElem = await cell.$("p.def_font_s");
      if (pElem) {
        const pText = await pElem.textContent();
        if (pText) {
          // "掲載者"の後のテキストを抽出
          const pNormalized = pText.replace(/\s+/g, " ").trim();
          const publisherMatch = pNormalized.match(/掲載者\s+(.+?)(?:\s+掲載日|$)/);
          if (publisherMatch) {
            publisher = publisherMatch[1].trim();
          }
        }
      }

      // タイトルを抽出（aタグのテキスト）
      let title = "";
      let noticeId = undefined;
      const anchor = await cell.$("a");
      if (anchor) {
        const anchorText = await anchor.textContent();
        if (anchorText) {
          title = anchorText.replace(/\s+/g, " ").trim();
        }
        // お知らせIDを抽出（onclick属性から）
        const onclick = await anchor.getAttribute("onclick");
        if (onclick) {
          const idMatch = onclick.match(/openWin_u008\((\d+)/);
          if (idMatch) {
            noticeId = idMatch[1];
          }
        }
      }

      // aタグがない場合は別の方法で抽出
      if (!title) {
        const titleMatch = normalized.match(/(?:掲載者.*?\s+)?(.+?)\s*\([^()]+\)\s*$/);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }
      }

      // 未読チェック（コメントアウトされていない未読マークがある場合のみtrue）
      const unread = cellHtml.includes('<span class="def_color_red"') && !cellHtml.includes("<!--");

      // カテゴリを抽出（括弧内）
      const categoryMatch = normalized.match(/\(([^()]+)\)\s*$/);
      const category = categoryMatch ? categoryMatch[1] : undefined;

      // 詳細内容を抽出
      let detailHtml = cellHtml;
      let detailText = normalized;

      if (title) {
        results.push({
          id: noticeId || String(Date.now() + Math.random()),
          category,
          date,
          href: null,
          publisher: publisher || undefined,
          rawText: normalized,
          title,
          unread,
          detailHtml: null, // 後で詳細を取得
          detailText: null
        });
      }
      continue;
    }

    if (cells.length < 5) {
      continue;
    }

    // 掲載日を取得（4列目）
    const dateCell = cells[3];
    const dateText = await dateCell.textContent();
    const date = dateText ? dateText.replace(/\s+/g, " ").trim() : "";

    // 件名・内容セルを取得（5列目）
    const contentCell = cells[4];

    // お知らせIDを抽出（aタグのonclick属性から）
    let noticeId = undefined;
    const anchor = await contentCell.$("a");
    if (anchor) {
      const onclick = await anchor.getAttribute("onclick");
      if (onclick) {
        const idMatch = onclick.match(/openWin_u008\((\d+)/);
        if (idMatch) {
          noticeId = idMatch[1];
        }
      } else {
        // href属性からIDを抽出
        const href = await anchor.getAttribute("href");
        if (href) {
          const idMatch = href.match(/notice_idx=(\d+)/);
          if (idMatch) {
            noticeId = idMatch[1];
          }
        }
      }
    }

    // タイトルを抽出（h2タグまたはaタグ）
    const titleElem = await contentCell.$("h2, h3");
    let title = "";
    if (titleElem) {
      title = await titleElem.textContent();
      if (title) title = title.replace(/\s+/g, " ").trim();
    }

    if (!title && anchor) {
      const anchorText = await anchor.textContent();
      if (anchorText) {
        title = anchorText.replace(/\s+/g, " ").trim();
      }
    }

    if (!title) {
      const cellText = await contentCell.textContent();
      title = cellText ? cellText.slice(0, 100).replace(/\s+/g, " ").trim() : "";
    }

    // 詳細内容を抽出
    const detailDiv = await contentCell.$(".def_padding_tb_1");
    let detailHtml = "";
    let detailText = "";

    if (detailDiv) {
      detailHtml = await detailDiv.innerHTML();
      detailText = await detailDiv.textContent();
      if (detailText) detailText = detailText.replace(/\s+/g, " ").trim();
    }

    // カテゴリを抽出（括弧内）
    const cellText = await contentCell.textContent();
    const normalized = cellText ? cellText.replace(/\s+/g, " ").trim() : "";
    const categoryMatch = normalized.match(/\(([^()]+)\)\s*$/);
    const category = categoryMatch ? categoryMatch[1] : undefined;

    // 未読チェック
    const unread = normalized.includes("[未読]") || normalized.includes("未読");

    // 掲載者を抽出
    let publisher = undefined;
    const publisherMatch = normalized.match(/^([^\s]+(?:\s+[^\s]+)?)\s+/);
    if (publisherMatch && !publisherMatch[1].includes("【")) {
      publisher = publisherMatch[1].trim();
    }

    if (title) {
      results.push({
        id: noticeId || String(Date.now() + Math.random()),
        category,
        date,
        href: null,
        publisher: publisher || undefined,
        rawText: normalized,
        title,
        unread,
        detailHtml: null, // 後で詳細を取得
        detailText: null
      });
    }
  }

  return results;
}

async function extractNoticesFromDivList(divList) {
  const results = [];

  // テーブルを探す
  const table = await divList.$("table");
  if (!table) {
    return [];
  }

  const rows = await table.$$("tr");

  // 最初の行はヘッダーなのでスキップ
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // セルを取得
    const cells = await row.$$("td, th");
    if (cells.length < 5) continue;

    // 掲載日を取得（4列目）
    const dateCell = cells[3];
    const dateText = await dateCell.textContent();
    const date = dateText ? dateText.replace(/\s+/g, " ").trim() : "";

    // 件名・内容セルを取得（5列目）
    const contentCell = cells[4];

    // お知らせIDを抽出（aタグのonclick属性から）
    let noticeId = undefined;
    const anchor = await contentCell.$("a");
    if (anchor) {
      const onclick = await anchor.getAttribute("onclick");
      if (onclick) {
        const idMatch = onclick.match(/openWin_u008\((\d+)/);
        if (idMatch) {
          noticeId = idMatch[1];
        }
      } else {
        // href属性からIDを抽出
        const href = await anchor.getAttribute("href");
        if (href) {
          const idMatch = href.match(/notice_idx=(\d+)/);
          if (idMatch) {
            noticeId = idMatch[1];
          }
        }
      }
    }

    // タイトルを抽出（h2タグまたはaタグ）
    const titleElem = await contentCell.$("h2, h3");
    let title = "";
    if (titleElem) {
      title = await titleElem.textContent();
      if (title) title = title.replace(/\s+/g, " ").trim();
    }

    if (!title && anchor) {
      const anchorText = await anchor.textContent();
      if (anchorText) {
        title = anchorText.replace(/\s+/g, " ").trim();
      }
    }

    if (!title) {
      const cellText = await contentCell.textContent();
      title = cellText ? cellText.slice(0, 100).replace(/\s+/g, " ").trim() : "";
    }

    // 詳細内容を抽出
    const detailDiv = await contentCell.$(".def_padding_tb_1");
    let detailHtml = "";
    let detailText = "";

    if (detailDiv) {
      detailHtml = await detailDiv.innerHTML();
      detailText = await detailDiv.textContent();
      if (detailText) detailText = detailText.replace(/\s+/g, " ").trim();
    }

    // カテゴリを抽出（括弧内）
    const cellText = await contentCell.textContent();
    const normalized = cellText ? cellText.replace(/\s+/g, " ").trim() : "";
    const categoryMatch = normalized.match(/\(([^()]+)\)\s*$/);
    const category = categoryMatch ? categoryMatch[1] : undefined;

    // 未読チェック
    const unread = normalized.includes("[未読]") || normalized.includes("未読");

    // 掲載者を抽出
    let publisher = undefined;
    const publisherMatch = normalized.match(/^([^\s]+(?:\s+[^\s]+)?)\s+/);
    if (publisherMatch && !publisherMatch[1].includes("【")) {
      publisher = publisherMatch[1].trim();
    }

    results.push({
      category,
      date,
      href: null,
      publisher: publisher || undefined,
      rawText: normalized,
      title,
      unread,
      detailHtml,
      detailText
    });
  }

  return results;
}

async function extractSchedule(page) {
  await page.goto(PORTAL_SCHEDULE_URL, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1000);

  // locatorを使用してデータを抽出
  const table = page.locator("table.u009_table_schedule");
  const rowCount = await table.locator("tr").count();

  if (rowCount < 3) {
    return [];
  }

  // 曜日行を取得
  const weekdayCells = await table.locator("tr").nth(0).locator("th,td").all();
  const weekdays = [];
  for (const cell of weekdayCells) {
    const text = await cell.textContent();
    weekdays.push(text ? text.replace(/\s+/g, " ").trim() : "");
  }

  // 日付行を取得
  const dateCells = await table.locator("tr").nth(1).locator("th,td").all();
  const dateLabels = [];
  for (const cell of dateCells) {
    const text = await cell.textContent();
    dateLabels.push(text ? text.replace(/\s+/g, " ").trim() : "");
  }

  // イベントセルを取得
  const eventCells = await table.locator("tr").nth(2).locator("th,td").all();
  const results = [];

  for (let i = 0; i < eventCells.length; i++) {
    const cell = eventCells[i];
    const cellText = await cell.textContent();
    const normalized = cellText ? cellText.replace(/\s+/g, " ").trim() : "";

    // アンカーを確認
    const anchors = await cell.locator("a").all();
    let rawItems = [];

    if (anchors.length > 0) {
      for (const anchor of anchors) {
        const text = await anchor.textContent();
        if (text) {
          rawItems.push(text.replace(/\s+/g, " ").trim());
        }
      }
    } else {
      // 時刻パターンで分割
      const timeMatches = normalized.match(/\d{1,2}:\d{2}[～~-]\d{1,2}:\d{2}/g);
      if (timeMatches && timeMatches.length > 1) {
        let lastIndex = 0;
        for (let j = 0; j < timeMatches.length; j++) {
          const match = timeMatches[j];
          const matchIndex = normalized.indexOf(match, lastIndex);
          const endIndex = j + 1 < timeMatches.length ? normalized.indexOf(timeMatches[j + 1], matchIndex) : normalized.length;
          rawItems.push(normalized.slice(matchIndex, endIndex).trim());
          lastIndex = matchIndex;
        }
      } else {
        rawItems.push(normalized);
      }
    }

    for (const rawText of rawItems) {
      if (rawText) {
        const timeMatch = rawText.match(/^(\d{1,2}:\d{2}[～~-]\d{1,2}:\d{2})\s*(.*)$/);
        results.push({
          dateLabel: dateLabels[i] || "",
          weekday: weekdays[i] || "",
          time: timeMatch ? timeMatch[1] : undefined,
          title: timeMatch ? timeMatch[2].trim() : rawText,
          rawText,
        });
      }
    }
  }

  return results;
}

async function extractTimetable(page) {
  await page.goto(PORTAL_TIMETABLE_URL, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1000);

  // locatorを使用してデータを抽出
  const table = page.locator("table.u004_table_jikanwari");
  const rows = await table.locator("tr").all();

  if (rows.length < 2) {
    return [];
  }

  // 曜日を取得
  const headerCells = await rows[0].locator("th,td").all();
  const days = [];
  for (let i = 1; i < headerCells.length; i++) {
    const text = await headerCells[i].textContent();
    days.push(text ? text.replace(/\s+/g, " ").trim() : "");
  }

  const results = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = await row.locator("th,td").all();

    const periodText = await cells[0].textContent();
    const period = periodText ? periodText.replace(/\s+/g, " ").trim() : "";

    for (let j = 1; j < cells.length; j++) {
      const cell = cells[j];
      const rawText = await cell.textContent();
      const normalized = rawText ? rawText.replace(/\s+/g, " ").trim() : "";

      if (!normalized) {
        continue;
      }

      const anchor = cell.locator("a").first();
      const anchorText = await anchor.textContent();
      const normalizedAnchor = anchorText ? anchorText.replace(/\s+/g, " ").trim() : "";

      const courseMatch = (normalizedAnchor || normalized).match(/^\[([^\]]+)\](.+)$/);
      const courseCode = courseMatch ? courseMatch[1] : undefined;
      const title = courseMatch ? courseMatch[2].trim() : (normalizedAnchor || normalized);

      let room = undefined;
      if (normalizedAnchor && normalized.startsWith(normalizedAnchor)) {
        room = normalized.slice(normalizedAnchor.length).trim();
      }

      results.push({
        courseCode,
        day: days[j - 1] || "",
        period,
        rawText: normalized,
        room: room || undefined,
        title,
      });
    }
  }

  return results;
}

// お知らせの詳細を取得する関数
async function fetchNoticeDetails(page, notices) {
  const results = [];

  // 各お知らせの詳細を取得
  for (let i = 0; i < notices.length; i++) {
    const notice = notices[i];
    console.log("   詳細取得中: " + (i + 1) + "/" + notices.length + " - " + notice.title.slice(0, 30));

    let detailHtml = null;
    let detailText = null;

    if (notice.id && /^\d+$/.test(notice.id)) {
      try {
        // 直接詳細ページにアクセス
        const detailUrl = `https://portalweb.uec.ac.jp/Portal/u008/getNoticeDetail.php?notice_idx=${notice.id}`;

        await page.goto(detailUrl, { waitUntil: "networkidle", timeout: 15000 });
        await page.waitForTimeout(500);

        // お知らせ本文はhidden inputのsrc1に入っている
        const src1Input = await page.$("#src1");
        if (src1Input) {
          const src1Value = await src1Input.inputValue();
          if (src1Value && src1Value.trim().length > 0) {
            detailText = src1Value.trim();
            // 改行を保持したままHTMLに変換
            detailHtml = detailText.split("\n").map(line => `<p>${line}</p>`).join("");
            console.log("   詳細取得成功: " + detailText.slice(0, 50) + "...");
          }
        }

        // src1が空または見つからない場合はbody全体を取得
        if (!detailText || detailText.length < 10) {
          const bodyHtml = await page.innerHTML("body");
          detailHtml = bodyHtml;

          // テキストも取得
          const bodyText = await page.textContent("body");
          const normalized = bodyText ? bodyText.replace(/\s+/g, " ").trim() : "";

          // CSSなどが含まれている場合、タイトル以降を抽出
          const titleIndex = normalized.indexOf(notice.title);
          if (titleIndex !== -1 && titleIndex + notice.title.length < normalized.length) {
            detailText = normalized.slice(titleIndex + notice.title.length).trim().slice(0, 3000);
          } else {
            detailText = normalized.slice(0, 3000);
          }
        }
      } catch (e) {
        console.log("   詳細取得エラー: " + e.message);
      }
    }

    results.push({
      ...notice,
      detailHtml,
      detailText
    });
  }

  return results;
}

main().catch((err) => {
  console.error("❌ エラーが発生しました:", err);
  process.exit(1);
});
