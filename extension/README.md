# Portfolio Hub Chrome Extension

ポートフォリオサイトの通知を管理するChrome拡張機能。

## 機能

- 🔔 **通知機能**: サイトを閉じていても通知を受け取れる
- 📋 **タスクリマインダー**: 期限が近いタスクを通知
- 🏆 **AtCoderリマインダー**: コンテスト開始を通知
- 💼 **就活リマインダー**: 面接等の予定を通知
- 🎯 **クイックアクセス**: ワンクリックでアプリケーションハブを開く

## インストール方法

### 開発版（ローカル）

1. アイコンを用意する
   - `icons/README.md` を参照してアイコンを作成
   - `icon16.png`, `icon48.png`, `icon128.png` を配置

2. Chromeに拡張機能をロード
   - Chromeを開く
   - `chrome://extensions/` にアクセス
   - 右上の「デベロッパーモード」をオン
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - この `extension/` ディレクトリを選択

3. 本番サイトの場合
   - `manifest.json` の `host_permissions` を本番URLに変更
   - `background.js` の `API_BASE` を本番URLに変更

## ファイル構成

```
extension/
├── manifest.json       # 拡張機能の設定ファイル
├── background.js       # Service Worker（通知チェック）
├── popup.html          # ポップアップUI
├── popup.js           # ポップアップの機能
├── content.js         # Content Script（サイト内バッジ）
└── icons/             # アイコンファイル
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 設定

ポップアップから以下の設定が可能：
- 通知のオン/オフ
- AtCoderリマインダーのオン/オフ
- タスクリマインダーのオン/オフ
- 就活リマインダーのオン/オフ

## APIエンドポイント

拡張機能は以下のAPIエンドポイントを使用：

- `GET /api/notifications/atcoder` - AtCoderコンテスト通知
- `GET /api/notifications/tasks` - タスクリマインダー
- `GET /api/notifications/jobs` - 就活リマインダー
- `GET /api/notifications/unread` - 未読通知数

## 開発

### 変更を適用するには
1. `chrome://extensions/` で拡張機能をリロード
2. サイト側のAPIも変更した場合は開発サーバーを再起動

### デバッグ
- Service Worker: `chrome://extensions/` → 「Service Worker」をクリック
- ポップアップ: ポップアップを右クリック → 「検証」
- Content Script: サイトのDevTools → Console

## トラブルシューティング

### 通知が来ない場合
1. Chromeの通知設定を確認（設定 → プライバシーとセキュリティ → 通知）
2. 拡張機能の権限を確認
3. Service Workerが実行されているか確認

### APIエラーが出る場合
1. 開発サーバーが動いているか確認（`npm run dev`）
2. `manifest.json` の `host_permissions` を確認
3. `background.js` の `API_BASE` を確認

## 本番デプロイ

### Chrome Web Storeへの提出
1. アイコンを作成（必須）
2. スクリーンショットを用意（1280x800px または 640x400px）
3. プライバシーポリシーを作成
4. `manifest.json` を本番用に更新
5. zipファイルでパッケージ化
6. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard) に提出

## ライセンス

MIT
