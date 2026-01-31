'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, SwatchIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { switchTheme, getStoredTheme, type Theme } from '@/utils/theme';

interface ThemeTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ThemeOption {
  key: 'default' | 'orange' | 'blue';
  name: string;
  description: string;
  previewColor: string;
}

const themeOptions: ThemeOption[] = [
  {
    key: 'default',
    name: '默认主题',
    description: '当前项目默认深蓝色主题',
    previewColor: '#1e3965',
  },
  {
    key: 'orange',
    name: '橙色主题',
    description: '橙色/桃色主题配色方案',
    previewColor: '#fc9a55',
  },
  {
    key: 'blue',
    name: '蓝色主题',
    description: '蓝色主题配色方案',
    previewColor: '#1994bd',
  },
];

export default function ThemeTestModal({ isOpen, onClose }: ThemeTestModalProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      // 获取当前主题
      const stored = getStoredTheme();
      setCurrentTheme(stored);
      setMessage(null);
    }
  }, [isOpen]);

  // 监听主题变化（通过轮询检查）
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      const stored = getStoredTheme();
      if (stored && stored.name !== currentTheme?.name) {
        setCurrentTheme(stored);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen, currentTheme]);

  const handleSwitchTheme = async (themeKey: 'default' | 'orange' | 'blue') => {
    setSwitching(themeKey);
    setMessage(null);

    try {
      const theme = await switchTheme(themeKey);
      if (theme) {
        setCurrentTheme(theme);
        setMessage({ type: 'success', text: `已切换到${themeOptions.find(t => t.key === themeKey)?.name}` });
        
        // 强制刷新按钮样式（确保 CSS 变量生效）
        setTimeout(() => {
          // 触发重排，确保样式更新
          document.body.offsetHeight;
        }, 100);
      } else {
        setMessage({ type: 'error', text: '切换主题失败' });
      }
    } catch (error) {
      console.error('切换主题失败:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '切换主题失败' });
    } finally {
      setSwitching(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <SwatchIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">主题切换测试</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {/* 消息提示 */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{message.text}</span>
            </div>
          )}

          {/* 当前主题信息 */}
          {currentTheme && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">当前主题</h3>
              <div className="text-sm text-gray-600">
                <div>名称: <span className="font-medium">{currentTheme.name}</span></div>
                {currentTheme.description && (
                  <div className="mt-1">描述: {currentTheme.description}</div>
                )}
              </div>
            </div>
          )}

          {/* 主题列表 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map((theme) => (
              <div
                key={theme.key}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  currentTheme?.name === theme.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => handleSwitchTheme(theme.key)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-200"
                    style={{ backgroundColor: theme.previewColor }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{theme.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{theme.description}</p>
                  </div>
                  {currentTheme?.name === theme.name && (
                    <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSwitchTheme(theme.key);
                  }}
                  disabled={switching === theme.key || currentTheme?.name === theme.name}
                  className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    currentTheme?.name === theme.name
                      ? 'btn-primary cursor-default'
                      : switching === theme.key
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {switching === theme.key ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500" />
                      切换中...
                    </span>
                  ) : currentTheme?.name === theme.name ? (
                    '当前主题'
                  ) : (
                    '切换到此主题'
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* 按钮预览 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">按钮样式预览</h3>
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary px-4 py-2 rounded-md text-sm font-medium">
                主要按钮（.btn-primary）
              </button>
              <button 
                className="px-4 py-2 rounded-md text-sm font-medium"
                style={{
                  backgroundColor: 'var(--button-primary-bg)',
                  color: 'var(--button-primary-text)',
                }}
              >
                主要按钮（内联样式）
              </button>
              <button className="bg-primary text-primary hover:bg-primary-hover px-4 py-2 rounded-md text-sm font-medium">
                主要按钮（Tailwind类）
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              <div>当前按钮颜色: <span className="font-mono">{currentTheme?.cssVariables['--button-primary-bg'] || '未设置'}</span></div>
            </div>
          </div>

          {/* 主题预览信息 */}
          {currentTheme && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">当前主题 CSS 变量</h3>
              <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                {JSON.stringify(currentTheme.cssVariables, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
