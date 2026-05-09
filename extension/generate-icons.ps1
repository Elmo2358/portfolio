# Chrome拡張機能アイコン生成スクリプト
# PowerShellでPNGアイコンを生成

Add-Type -AssemblyName System.Drawing

function Create-Icon {
    param([int]$size)

    # ビットマップを作成
    $bitmap = New-Object System.Drawing.Bitmap $size, $size

    # グラフィックスオブジェクトを作成
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

    # 背景グラデーション
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(`
        $rect,
        [System.Drawing.Color]::FromArgb(16, 185, 129),
        [System.Drawing.Color]::FromArgb(5, 150, 105),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )

    # 角丸の背景を描画
    $radius = $size * 0.2
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.FillRectangle($gradient, $rect)

    # 家のアイコンを描画
    $centerX = $size / 2
    $centerY = $size / 2
    $scale = $size / 128

    # 屋根
    $roofBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $roofPoints = @(
        New-Object System.Drawing.Point([int]$centerX, [int]($centerY - 25 * $scale)),
        New-Object System.Drawing.Point([int]($centerX - 30 * $scale), [int]$centerY),
        New-Object System.Drawing.Point([int]($centerX + 30 * $scale), [int]$centerY)
    )
    $graphics.FillPolygon($roofBrush, $roofPoints)

    # 本体
    $bodyRect = New-Object System.Drawing.Rectangle(`
        [int]($centerX - 20 * $scale),
        [int]$centerY,
        [int](40 * $scale),
        [int](30 * $scale)
    )
    $graphics.FillRectangle($roofBrush, $bodyRect)

    # ドア
    $doorBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 185, 129))
    $doorRect = New-Object System.Drawing.Rectangle(`
        [int]($centerX - 6 * $scale),
        [int]($centerY + 10 * $scale),
        [int](12 * $scale),
        [int](20 * $scale)
    )
    $graphics.FillRectangle($doorBrush, $doorRect)

    # 窓
    $window1Rect = New-Object System.Drawing.Rectangle(`
        [int]($centerX - 15 * $scale),
        [int]($centerY + 8 * $scale),
        [int](8 * $scale),
        [int](8 * $scale)
    )
    $window2Rect = New-Object System.Drawing.Rectangle(`
        [int]($centerX + 7 * $scale),
        [int]($centerY + 8 * $scale),
        [int](8 * $scale),
        [int](8 * $scale)
    )
    $graphics.FillRectangle($roofBrush, $window1Rect)
    $graphics.FillRectangle($roofBrush, $window2Rect)

    # 保存
    $outputPath = Join-Path $PSScriptRoot "icons\icon$size.png"
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    # リソースを解放
    $graphics.Dispose()
    $bitmap.Dispose()

    Write-Host "✅ Generated: icon$size.png" -ForegroundColor Green
}

# iconsディレクトリを作成
$iconsDir = Join-Path $PSScriptRoot "icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
}

# 各サイズのアイコンを生成
Write-Host "🎨 Generating Chrome extension icons..." -ForegroundColor Cyan
Create-Icon 16
Create-Icon 48
Create-Icon 128

Write-Host "`n✨ All icons generated successfully!" -ForegroundColor Green
Write-Host "📁 Location: extension/icons/" -ForegroundColor Cyan
