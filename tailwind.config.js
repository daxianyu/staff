/** @type {import('tailwindcss').Config} */
module.exports = {
  future: {
    // 禁用新的特异性策略
    disableCustomNativeImport: true,
  },
  corePlugins: {
    preflight: false,
  },
  mode: 'aot', // 使用AOT模式而不是JIT模式
  purge: {
    // 确保正确捕获所有使用的类名
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    options: {
      safelist: [
        // 添加可能动态生成但在构建时无法检测到的类
        'modal-backdrop',
        /^bg-/,
        /^text-/,
        // 其他关键类名
      ],
    },
  },
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
  target: {
    browserslist: [
      'last 2 years',
      'not dead',
      '> 0.2%',
      'iOS >= 16',
      'Android >= 7'
    ]
  }
} 
