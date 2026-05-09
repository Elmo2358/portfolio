# アイコン作成ガイド

Chrome拡張機能には以下のサイズのアイコンが必要です：
- icon16.png (16x16px)
- icon48.png (48x48px)
- icon128.png (128x128px)

## 作成方法

### 方法1: オンラインツールを使用
1. [Figma](https://www.figma.com/) または [Canva](https://www.canva.com/) でアイコンを作成
2. サイズ: 128x128px（拡張して他のサイズもエクスポート）
3. カラーパレット:
   - Primary: #10b981 (Emerald green)
   - Secondary: #059669 (Darker green)
4. 各サイズでPNG形式でエクスポート

### 方法2: 簡易的なSVGから変換
以下のSVGをbase64エンコーダーで変換して使用できます：
```svg
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="24" fill="#10b981"/>
  <text x="64" y="80" font-size="48" text-anchor="middle" fill="white" font-family="Arial">🏠</text>
</svg>
```

### 方法3: アイコン生成サービス
- [AppIconGenerator](https://appicon.co/)
- [IconKitchen](https://icon.kitchen/)

## 配置
作成したアイコンをこのディレクトリに配置：
- icon16.png
- icon48.png
- icon128.png
