import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  webpack: (config) => {
    // 将 moment 的语言包标记为“有副作用”（防止被移除）
    config.module.rules.push({
      test: /moment[\/\\]locale[\/\\](zh-cn)/,
      sideEffects: true,
    });

    return config;
  },
};

export default nextConfig;
