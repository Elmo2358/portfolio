// Content Script - サイト内に通知バッジを表示

// 環境設定（デフォルトは本番）
const ENVIRONMENTS = {
  development: 'http://localhost:3000',
  production: 'https://elmo2358.net'
}

let baseUrl = ENVIRONMENTS.production

// 環境設定を取得
function loadEnvironment() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['environment'], (result) => {
      baseUrl = ENVIRONMENTS[result.environment] || ENVIRONMENTS.production
    })
  }
}

// 通知バッジを作成
function createNotificationBadge() {
  const badge = document.createElement('div')
  badge.id = 'portfolio-hub-badge'
  badge.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 50px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    " onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'">
      <span>🔔</span>
      <span class="badge-count">0</span>
      <span style="font-size: 12px; opacity: 0.9;">通知</span>
    </div>
  `

  document.body.appendChild(badge)

  // クリックでハブを開く
  badge.addEventListener('click', () => {
    window.location.href = '/hub'
  })
}

// 通知数を更新
function updateNotificationCount() {
  const badge = document.getElementById('portfolio-hub-badge')
  if (!badge) return

  // 相対パスでAPI呼び出し（現在のサイトのAPIを使用）
  fetch('/api/notifications/unread')
    .then(res => res.json())
    .then(data => {
      const countEl = badge.querySelector('.badge-count')
      if (countEl) {
        countEl.textContent = data.count || 0
      }
    })
    .catch(() => {
      const countEl = badge.querySelector('.badge-count')
      if (countEl) {
        countEl.textContent = '0'
      }
    })
}

// 初期化
function init() {
  // 既存のバッジがあれば削除
  const existingBadge = document.getElementById('portfolio-hub-badge')
  if (existingBadge) {
    existingBadge.remove()
  }

  // バッジを作成
  createNotificationBadge()

  // 定期的に更新（1分ごと）
  setInterval(updateNotificationCount, 60000)
}

// ページ読み込み時に実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

// ページ遷移時に再実行（SPA対応）
const originalPushState = history.pushState
const originalReplaceState = history.replaceState

history.pushState = function(...args) {
  originalPushState.apply(this, args)
  setTimeout(init, 100)
}

history.replaceState = function(...args) {
  originalReplaceState.apply(this, args)
  setTimeout(init, 100)
}

window.addEventListener('popstate', () => {
  setTimeout(init, 100)
})

// 環境設定を読み込む
loadEnvironment()
