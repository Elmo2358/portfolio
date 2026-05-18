// 環境設定
const ENVIRONMENTS = {
  development: {
    name: '開発環境',
    apiBase: 'http://localhost:3000/api',
    hubUrl: 'http://localhost:3000'
  },
  production: {
    name: '本番環境',
    apiBase: 'https://elmo2358.net/api',
    hubUrl: 'https://elmo2358.net'
  }
}

const DEFAULT_ENV = 'production'

// 現在の環境設定を取得
async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['environment'], (result) => {
      const env = result.environment || DEFAULT_ENV
      resolve(ENVIRONMENTS[env] || ENVIRONMENTS[DEFAULT_ENV])
    })
  })
}

// 設定
const POLLING_INTERVAL_MINUTES = 5 // 5分ごとにチェック

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
    periodInMinutes: POLLING_INTERVAL_MINUTES
  })

  // 初期設定を保存
  chrome.storage.local.set({
    environment: DEFAULT_ENV,
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
    const config = await getConfig()
    const settings = await getSettings()

    if (!settings.notificationsEnabled) {
      return
    }

    // AtCoderコンテスト通知
    if (settings.atCoderReminders) {
      await checkAtCoderContests(config)
    }

    // タスクリマインダー
    if (settings.taskReminders) {
      await checkTaskReminders(config)
    }

    // 就活リマインダー
    if (settings.jobReminders) {
      await checkJobReminders(config)
    }
  } catch (error) {
    console.error('Error checking notifications:', error)
  }
}

// AtCoderコンテストをチェック
async function checkAtCoderContests(config) {
  try {
    const response = await fetch(`${config.apiBase}/notifications/atcoder`)
    if (!response.ok) return

    const data = await response.json()

    if (data.notifications && data.notifications.length > 0) {
      data.notifications.forEach(notification => {
        showNotification(config, {
          type: 'atcoder',
          title: '🏆 AtCoderコンテスト通知',
          message: notification.message,
          iconUrl: chrome.runtime.getURL('icons/icon48.png'),
          url: notification.url || `${config.hubUrl}/hub/atcoder`,
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
async function checkTaskReminders(config) {
  try {
    const response = await fetch(`${config.apiBase}/notifications/tasks`)
    if (!response.ok) return

    const data = await response.json()

    if (data.notifications && data.notifications.length > 0) {
      data.notifications.forEach(notification => {
        showNotification(config, {
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
async function checkJobReminders(config) {
  try {
    const response = await fetch(`${config.apiBase}/notifications/jobs`)
    if (!response.ok) return

    const data = await response.json()

    if (data.notifications && data.notifications.length > 0) {
      data.notifications.forEach(notification => {
        showNotification(config, {
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
function showNotification(config, options) {
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
    const config = await getConfig()
    const hubUrl = config.hubUrl

    // 既存のタブを探す
    const tabs = await chrome.tabs.query({ url: `${hubUrl}/*` })

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
chrome.notifications.onClicked.addListener(async (notificationId) => {
  const config = await getConfig()
  const metadata = getNotificationMetadata(notificationId)
  const url = metadata?.url || `${config.hubUrl}/hub`
  openOrCreateTab(url)
  chrome.notifications.clear(notificationId)
})

// 通知ボタンクリック時のハンドラ
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  const config = await getConfig()
  const metadata = getNotificationMetadata(notificationId)

  let url = `${config.hubUrl}/hub`

  switch (metadata?.type) {
    case 'atcoder':
      if (buttonIndex === 0) {
        // コンテストページ
        url = metadata.url || `${config.hubUrl}/hub/atcoder`
      } else {
        // ハブを開く
        url = `${config.hubUrl}/hub`
      }
      break

    case 'task':
      if (buttonIndex === 0) {
        // 完了にする
        if (metadata.taskId) {
          await completeTask(config, metadata.taskId)
        }
      } else {
        // 詳細を見る
        url = `${config.hubUrl}/hub`
      }
      break

    case 'job':
      if (buttonIndex === 0) {
        // 詳細を見る（就活セクション）
        url = `${config.hubUrl}/hub`
      } else {
        // ハブを開く
        url = `${config.hubUrl}/hub`
      }
      break

    default:
      url = `${config.hubUrl}/hub`
  }

  if (metadata?.type !== 'task' || buttonIndex !== 0) {
    openOrCreateTab(url)
  }

  chrome.notifications.clear(notificationId)
})

// タスクを完了にする
async function completeTask(config, taskId) {
  try {
    const response = await fetch(`${config.apiBase}/hub/tasks/${taskId}`, {
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
chrome.action.onClicked.addListener(async () => {
  const config = await getConfig()
  openOrCreateTab(`${config.hubUrl}/hub`)
})
