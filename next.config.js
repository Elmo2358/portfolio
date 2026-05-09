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

  // バンドルサイズの最適化
  webpack: (config, { isServer }) => {
    // 本番環境でのみ最適化
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },

  // 圧縮を有効化
  compress: true,

  // SWCの使用（デフォルトで有効）
  swcMinify: true,
}

module.exports = nextConfig
