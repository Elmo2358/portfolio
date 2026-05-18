# Portfolio Hub Chrome Extension

ポートフォリオサイトの通知を管理するChrome拡張機能。

**本番環境**: <https://elmo2358.net>

## 機能

- 🔔 **通知機能**: サイトを閉じていても通知を受け取れる
- 📋 **タスクリマインダー**: 期限が近いタスクを通知
- 🏆 **AtCoderリマインダー**: コンテスト開始を通知
- 💼 **就活リマインダー**: 面接等の予定を通知
- 🎯 **クイックアクセス**: ワンクリックでアプリケーションハブを開く
- 🔄 **環境切り替え**: ポップアップから本番/開発環境を切り替え可能

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

3. 環境を設定
   - 拡張機能のポップアップを開く
   - 「接続先環境」で「本番環境」または「開発環境」を選択

## ファイル構成

```
extension/
├── manifest.json       # 拡張機能の設定ファイル
├── background.js       # Service Worker（通知チェック）
├── config.js          # 環境設定管理
├── popup.html          # ポップアップUI
├── popup.js           # ポップアップの機能
├── content.js         # Content Script（サイト内バッジ）
├── icons/             # アイコンファイル
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── PRIVACY.md         # プライバシーポリシー
├── STORE_DESCRIPTION.md  # ストア用説明文
└── PACKAGE_README.md  # パッケージ化手順
```

## 設定

ポップアップから以下の設定が可能：
- **接続先環境**: 本番環境 / 開発環境の切り替え
- 通知のオン/オフ
- AtCoderリマインダーのオン/オフ
- タスクリマインダーのオン/オフ
- 就活リマインダーのオン/オフ

## 環境

| 環境 | URL |
|------|-----|
| 本番環境 | <https://elmo2358.net> |
| 開発環境 | `http://localhost:3000` |

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
1. ポップアップの「接続先環境」が正しいか確認
2. 本番環境の場合: サイトがデプロイされているか確認
3. 開発環境の場合: 開発サーバーが動いているか確認（`npm run dev`）

## 本番デプロイ

### Chrome Web Storeへの提出

1. アイコンを作成（必須）
2. スクリーンショットを用意（1280x800px または 640x400px）
3. プライバシーポリシーを作成（`PRIVACY.md`）
4. `manifest.json` を本番用に更新（✅ 完了済み）
5. ZIPファイルでパッケージ化
6. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard) に提出

詳細は `PACKAGE_README.md` を参照してください。

## ライセンス

MIT
