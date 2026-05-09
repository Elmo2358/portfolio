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
  loadSettings()
  getUnreadCount()
  updateStatus('最終更新')

  // 設定変更時に保存
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', saveSettings)
  })
})

// リンククリック時にポップアップを閉じないようにする
document.querySelectorAll('a[href^="http"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault()
    chrome.tabs.create({ url: link.href })
    window.close()
  })
})
