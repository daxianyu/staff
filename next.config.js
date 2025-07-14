/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://www.huayaopudong.com/api/:path*' // 开发环境
      }
    ]
  },
  webpack: (config) => {
    // 将 moment 的语言包标记为“有副作用”（防止被移除）
    config.module.rules.push({
      test: /moment[\/\\]locale[\/\\](zh-cn)/,
      sideEffects: true,
    });

    return config;
  },
  eslint: {
    // 警告会在终端和浏览器控制台中显示，但不会导致构建失败
    ignoreDuringBuilds: true,
  },
  ...(process.env.NODE_ENV === 'development' ? {} : {
    output: 'export',
    basePath: '/staff',
    assetPrefix: '/staff/',
    trailingSlash: false,
  })
}

module.exports = nextConfig 