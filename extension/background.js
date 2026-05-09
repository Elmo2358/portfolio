// 設定
const CONFIG = {
  API_BASE: 'http://localhost:3000/api',
  POLLING_INTERVAL_MINUTES: 5, // 5分ごとにチェック
  NOTIFICATION_CHECK_INTERVAL_MINUTES: 1, // 1分ごとに通知チェック
  HUB_URL: 'http://localhost:3000'
}

// 通知メタデータを管理（通知ID → データのマップ）
const notificationMetadata = new Map()

// 通知メタデータを保存
function saveNotificationMetadata(notificationId, metadata) {
  notificationMetadata.set(notificationId, metadata)
}

// 通知メタデータを取得
function getNotificationMetadata(notificationId) {
  return notificationMetadata.get(notificationId)
}

// インストール時の初期化
chrome.runtime.onInstalled.addListener(() => {
  console.log('Portfolio Hub Extension installed')

  // アラームを設定
  chrome.alarms.create('pollNotifications', {
    periodInMinutes: CONFIG.POLLING_INTERVAL_MINUTES
  })

  // 初期設定を保存
  chrome.storage.local.set({
    notificationsEnabled: true,
    atCoderReminders: true,
    taskReminders: true,
    jobReminders: true
  })
})

// アラームで定期チェック
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'pollNotifications') {
    checkNotifications()
  }
})

// 通知をチェック
async function checkNotifications() {
  try {
    const settings = await getSettings()

    if (!settings.notificationsEnabled) {
      return
    }

    // AtCoderコンテスト通知
    if (settings.atCoderReminders) {
      await checkAtCoderContests()
    }

    // タスクリマインダー
    if (settings.taskReminders) {
      await checkTaskReminders()
    }

    // 就活リマインダー
    if (settings.jobReminders) {
      await checkJobReminders()
    }
  } catch (error) {
    console.error('Error checking notifications:', error)
  }
}

// AtCoderコンテストをチェック
async function checkAtCoderContests() {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/notifications/atcoder`)
    if (!response.ok) return

    const data = await response.json()

    if (data.notifications && data.notifications.length > 0) {
      data.notifications.forEach(notification => {
        showNotification({
          type: 'atcoder',
          title: '🏆 AtCoderコンテスト通知',
          message: notification.message,
          iconUrl: chrome.runtime.getURL('icons/icon48.png'),
          url: notification.url || `${CONFIG.HUB_URL}/hub/atcoder`,
          buttons: [
            { title: '🔗 コンテストページ' },
            { title: '📋 ハブを開く' }
          ]
        })
      })
    }
  } catch (error) {
    console.error('Error checking AtCoder contests:', error)
  }
}

// タスクリマインダーをチェック
async function checkTaskReminders() {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/notifications/tasks`)
    if (!response.ok) return

    const data = await response.json()

    if (data.notifications && data.notifications.length > 0) {
      data.notifications.forEach(notification => {
        showNotification({
          type: 'task',
          title: '📋 タスクリマインダー',
          message: notification.message,
          iconUrl: chrome.runtime.getURL('icons/icon48.png'),
          taskId: notification.id,
          buttons: [
            { title: '✅ 完了にする' },
            { title: '📋 詳細を見る' }
          ]
        })
      })
    }
  } catch (error) {
    console.error('Error checking task reminders:', error)
  }
}

// 就活リマインダーをチェック
async function checkJobReminders() {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/notifications/jobs`)
    if (!response.ok) return

    const data = await response.json()

    if (data.notifications && data.notifications.length > 0) {
      data.notifications.forEach(notification => {
        showNotification({
          type: 'job',
          title: '💼 就活リマインダー',
          message: notification.message,
          iconUrl: chrome.runtime.getURL('icons/icon48.png'),
          applicationId: notification.applicationId,
          buttons: [
            { title: '📋 詳細を見る' },
            { title: '📊 ハブを開く' }
          ]
        })
      })
    }
  } catch (error) {
    console.error('Error checking job reminders:', error)
  }
}

// 通知を表示
function showNotification(options) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: options.iconUrl || chrome.runtime.getURL('icons/icon48.png'),
    title: options.title,
    message: options.message,
    buttons: options.buttons || [],
    priority: 2,
    requireInteraction: true // ユーザーが操作するまで表示
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error('Notification error:', chrome.runtime.lastError)
    } else {
      // 通知メタデータを保存
      saveNotificationMetadata(notificationId, {
        type: options.type || 'default',
        url: options.url,
        taskId: options.taskId,
        applicationId: options.applicationId
      })
    }
  })
}

// 新しいタブを開くか、既存のタブを更新
async function openOrCreateTab(url) {
  try {
    // 既存のタブを探す
    const tabs = await chrome.tabs.query({ url: `${CONFIG.HUB_URL}/*` })

    if (tabs.length > 0) {
      // 既存のタブを更新してフォーカス
      await chrome.tabs.update(tabs[0].id, { url, active: true })
    } else {
      // 新しいタブを作成
      await chrome.tabs.create({ url })
    }
  } catch (error) {
    console.error('Error opening tab:', error)
    // フォールバック: 新しいタブを作成
    try {
      await chrome.tabs.create({ url })
    } catch (e) {
      console.error('Error creating tab:', e)
    }
  }
}

// 通知クリック時のハンドラ
chrome.notifications.onClicked.addListener((notificationId) => {
  const metadata = getNotificationMetadata(notificationId)
  const url = metadata?.url || `${CONFIG.HUB_URL}/hub`
  openOrCreateTab(url)
  chrome.notifications.clear(notificationId)
})

// 通知ボタンクリック時のハンドラ
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  const metadata = getNotificationMetadata(notificationId)

  let url = `${CONFIG.HUB_URL}/hub`

  switch (metadata?.type) {
    case 'atcoder':
      if (buttonIndex === 0) {
        // コンテストページ
        url = metadata.url || `${CONFIG.HUB_URL}/hub/atcoder`
      } else {
        // ハブを開く
        url = `${CONFIG.HUB_URL}/hub`
      }
      break

    case 'task':
      if (buttonIndex === 0) {
        // 完了にする
        if (metadata.taskId) {
          await completeTask(metadata.taskId)
        }
      } else {
        // 詳細を見る
        url = `${CONFIG.HUB_URL}/hub`
      }
      break

    case 'job':
      if (buttonIndex === 0) {
        // 詳細を見る（就活セクション）
        url = `${CONFIG.HUB_URL}/hub`
      } else {
        // ハブを開く
        url = `${CONFIG.HUB_URL}/hub`
      }
      break

    default:
      url = `${CONFIG.HUB_URL}/hub`
  }

  if (metadata?.type !== 'task' || buttonIndex !== 0) {
    openOrCreateTab(url)
  }

  chrome.notifications.clear(notificationId)
})

// タスクを完了にする
async function completeTask(taskId) {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/hub/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        completedAt: new Date().toISOString()
      })
    })

    if (response.ok) {
      // 完了通知を表示
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title: '✅ タスク完了',
        message: 'タスクを完了にしました',
        priority: 1
      })
    } else {
      console.error('Failed to complete task:', response.status)
    }
  } catch (error) {
    console.error('Error completing task:', error)
  }
}

// 設定を取得
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ['notificationsEnabled', 'atCoderReminders', 'taskReminders', 'jobReminders'],
      (result) => {
        resolve({
          notificationsEnabled: result.notificationsEnabled !== false,
          atCoderReminders: result.atCoderReminders !== false,
          taskReminders: result.taskReminders !== false,
          jobReminders: result.jobReminders !== false
        })
      }
    )
  })
}

// 拡張機能アイコンクリックでハブを開く
chrome.action.onClicked.addListener(() => {
  openOrCreateTab(`${CONFIG.HUB_URL}/hub`)
})
