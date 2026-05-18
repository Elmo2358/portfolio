// 環境設定
const ENVIRONMENTS = {
  development: {
    name: '開発環境',
    apiBase: 'http://localhost:3000/api',
    hubUrl: 'http://localhost:3000',
    class: 'development'
  },
  production: {
    name: '本番環境',
    apiBase: 'https://elmo2358.net/api',
    hubUrl: 'https://elmo2358.net',
    class: 'production'
  }
}

let currentConfig = ENVIRONMENTS.production

// 環境設定をロード
function loadEnvironment() {
  chrome.storage.local.get(['environment'], (result) => {
    const env = result.environment || 'production'
    currentConfig = ENVIRONMENTS[env]

    // セレクトボックスを更新
    document.getElementById('environmentSelect').value = env

    // インジケーターを更新
    const indicator = document.getElementById('envIndicator')
    indicator.textContent = currentConfig.name
    indicator.className = `env-indicator ${currentConfig.class}`

    // URL表示を更新
    document.getElementById('urlDisplay').textContent = currentConfig.hubUrl

    // リンクを更新
    updateLinks()
  })
}

// 環境設定を保存
function saveEnvironment(env) {
  currentConfig = ENVIRONMENTS[env]

  chrome.storage.local.set({ environment: env }, () => {
    // インジケーターを更新
    const indicator = document.getElementById('envIndicator')
    indicator.textContent = currentConfig.name
    indicator.className = `env-indicator ${currentConfig.class}`

    // URL表示を更新
    document.getElementById('urlDisplay').textContent = currentConfig.hubUrl

    // リンクを更新
    updateLinks()

    updateStatus(`環境を${currentConfig.name}に変更しました`)
  })
}

// リンクを更新
function updateLinks() {
  document.querySelectorAll('a[data-path]').forEach(link => {
    const path = link.getAttribute('data-path')
    link.href = currentConfig.hubUrl + path
  })
}

// 設定をロード
function loadSettings() {
  chrome.storage.local.get(
    ['notificationsEnabled', 'atCoderReminders', 'taskReminders', 'jobReminders'],
    (result) => {
      document.getElementById('notificationsEnabled').checked = result.notificationsEnabled !== false
      document.getElementById('atCoderReminders').checked = result.atCoderReminders !== false
      document.getElementById('taskReminders').checked = result.taskReminders !== false
      document.getElementById('jobReminders').checked = result.jobReminders !== false
    }
  )
}

// 設定を保存
function saveSettings() {
  const settings = {
    notificationsEnabled: document.getElementById('notificationsEnabled').checked,
    atCoderReminders: document.getElementById('atCoderReminders').checked,
    taskReminders: document.getElementById('taskReminders').checked,
    jobReminders: document.getElementById('jobReminders').checked
  }

  chrome.storage.local.set(settings, () => {
    updateStatus('設定を保存しました')
  })
}

// ステータスを更新
function updateStatus(message) {
  const statusEl = document.getElementById('status')
  const now = new Date()
  const time = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  statusEl.textContent = `${message} (${time})`
}

// 未読通知数を取得
function getUnreadCount() {
  // TODO: APIから未読数を取得
  document.getElementById('badge').textContent = '0'
}

// イベントリスナー
document.addEventListener('DOMContentLoaded', () => {
  // 環境設定をロード
  loadEnvironment()

  // 設定をロード
  loadSettings()

  // 未読数を取得
  getUnreadCount()

  updateStatus('最終更新')

  // 設定変更時に保存
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', saveSettings)
  })

  // 環境切り替え
  document.getElementById('environmentSelect').addEventListener('change', (e) => {
    saveEnvironment(e.target.value)
  })

  // リンククリック時の処理
  document.querySelectorAll('a[data-path]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const url = link.href
      chrome.tabs.create({ url })
      window.close()
    })
  })
})
