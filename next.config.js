/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://www.huayaopudong.com/api/:path*' // 开发环境
      }
    ]
  },
  eslint: {
    // 警告会在终端和浏览器控制台中显示，但不会导致构建失败
    ignoreDuringBuilds: true,
  },
  ...(process.env.NODE_ENV === 'development' ? {} : {
    output: 'export',
    basePath: '/student',
    assetPrefix: '/student/',
    trailingSlash: false,
  })
}

module.exports = nextConfig 