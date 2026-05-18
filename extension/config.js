// 環境設定管理
// 開発/本番環境の切り替えを管理するモジュール

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

// デフォルト環境
const DEFAULT_ENV = 'production'

// 環境を取得
async function getCurrentEnvironment() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['environment'], (result) => {
      resolve(result.environment || DEFAULT_ENV)
    })
  })
}

// 環境を設定
async function setEnvironment(env) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ environment: env }, () => {
      resolve(env)
    })
  })
}

// 現在の環境設定を取得
async function getConfig() {
  const env = await getCurrentEnvironment()
  return ENVIRONMENTS[env] || ENVIRONMENTS[DEFAULT_ENV]
}

// すべての環境を取得
function getAllEnvironments() {
  return ENVIRONMENTS
}
