const fs = require('fs')
const path = require('path')

// Canvasを模擬してアイコンを生成
// 簡易的なSVGを作成してPNGとして保存

function generateIconSVG(size) {
  const radius = size * 0.2
  const scale = size / 128
  const fontSize = Math.floor(size * 0.4)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- 角丸の背景 -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" fill="url(#grad)"/>

  <!-- 家のアイコン -->
  <g transform="translate(${size/2}, ${size/2})">
    <!-- 屋根 -->
    <path d="M 0 ${-25 * scale} L ${-30 * scale} 0 L ${30 * scale} 0 Z" fill="white"/>

    <!-- 本体 -->
    <rect x="${-20 * scale}" y="0" width="${40 * scale}" height="${30 * scale}" fill="white"/>

    <!-- ドア -->
    <rect x="${-6 * scale}" y="${10 * scale}" width="${12 * scale}" height="${20 * scale}" fill="#10b981"/>

    <!-- 窓 -->
    <rect x="${-15 * scale}" y="${8 * scale}" width="${8 * scale}" height="${8 * scale}" fill="white"/>
    <rect x="${7 * scale}" y="${8 * scale}" width="${8 * scale}" height="${8 * scale}" fill="white"/>
  </g>
</svg>`
}

// SVGファイルを生成
const sizes = [16, 48, 128]

// 出力ディレクトリ
const outputDir = path.join(__dirname, 'icons')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

sizes.forEach(size => {
  const svg = generateIconSVG(size)
  const filename = path.join(outputDir, `icon${size}.svg`)
  fs.writeFileSync(filename, svg)
  console.log(`Generated: icons/icon${size}.svg`)
})

console.log('\n✅ SVG icons generated!')
console.log('\n📝 Note: These are SVG files. For Chrome extensions, PNG is recommended.')
console.log('You can convert SVG to PNG using:')
console.log('  - Online tool: https://cloudconvert.com/svg-to-png')
console.log('  - Figma/Illustrator')
console.log('  - Or use the generate-icons.html file in your browser')
