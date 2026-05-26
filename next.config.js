/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actionsを有効化
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
    // コード圧縮を有効化
    optimizeCss: true,
  },

  // 画像最適化
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // 圧縮を有効化
  compress: true,

  // Turbopackの設定（Next.js 16でデフォルト）
  turbopack: {},
}

module.exports = nextConfig
