'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, SwatchIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getAuthHeader } from '@/services/apiClient';

interface ThemeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ThemeData {
  name: string;
  description: string;
  colors: {
    primary: { background: string; text: string };
    sidebar: { background: string; text: string; [key: string]: any };
    header: { background: string; text: string };
    content: { background: string; cardBackground: string; border: string; text: string; [key: string]: any };
    button: { primary: { background: string; text: string } };
  };
  cssVariables: Record<string, string>;
}

interface ThemeConfig {
  default_theme: ThemeData;
  staff_theme: ThemeData;
}

export default function ThemeConfigModal({ isOpen, onClose }: ThemeConfigModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [config, setConfig] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      setMessage(null);
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };

      const response = await fetch('/api/site/api-echo-params?key=TEACHER_THEME', {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        // 新 API 返回的是纯文本（JSON 字符串）
        const text = await response.text();
        if (text) {
          try {
            // 先反序列化 JSON 字符串
            const parsedData = JSON.parse(text);
            // parsedData.data 是 JSON 字符串，需要再次反序列化
            let dataObj = parsedData.data;
            if (typeof dataObj === 'string') {
              dataObj = JSON.parse(dataObj);
            }
            
            // 提取主题配置
            let defaultTheme = dataObj.default_theme;
            let staffTheme = dataObj.staff_theme;
            
            // 如果主题配置是字符串，需要再次解析
            if (typeof defaultTheme === 'string') {
              defaultTheme = JSON.parse(defaultTheme);
            }
            if (typeof staffTheme === 'string') {
              staffTheme = JSON.parse(staffTheme);
            }
            
            setConfig({
              default_theme: defaultTheme || createDefaultTheme('default_theme'),
              staff_theme: staffTheme || createDefaultTheme('staff_theme'),
            });
          } catch (parseError) {
            console.error('解析主题配置 JSON 失败:', parseError);
            // 如果解析失败，创建默认配置
            setConfig({
              default_theme: createDefaultTheme('default_theme'),
              staff_theme: createDefaultTheme('staff_theme'),
            });
          }
        } else {
          // 如果没有数据，创建默认配置
          setConfig({
            default_theme: createDefaultTheme('default_theme'),
            staff_theme: createDefaultTheme('staff_theme'),
          });
        }
      } else {
        throw new Error('获取配置失败');
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '加载配置失败' });
      // 创建默认配置
      setConfig({
        default_theme: createDefaultTheme('default_theme'),
        staff_theme: createDefaultTheme('staff_theme'),
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTheme = (type: 'default_theme' | 'staff_theme'): ThemeData => {
    if (type === 'default_theme') {
      return {
        name: '默认主题',
        description: '当前项目默认深蓝色主题',
        colors: {
          primary: { background: '#1e3965', text: '#ffffff' },
          sidebar: { background: '#1e3965', text: '#ffffff' },
          header: { background: '#1e3965', text: '#ffffff' },
          content: { background: '#f5f5f5', cardBackground: '#ffffff', border: '#e5e5e5', text: '#333333' },
          button: { primary: { background: '#1e3965', text: '#ffffff' } },
        },
        cssVariables: {
          '--header-bg': '#1e3965',
          '--header-text': '#ffffff',
          '--sidebar-bg': '#1e3965',
          '--sidebar-text': '#ffffff',
          '--button-primary-bg': '#1e3965',
          '--button-primary-text': '#ffffff',
          '--button-primary-hover': '#2a4a75',
        },
      };
    } else {
      return {
        name: '橙色主题',
        description: '橙色/桃色主题配色方案',
        colors: {
          primary: { background: '#fc9a55', text: '#ffffff' },
          sidebar: { background: '#fc9a55', text: '#ffffff' },
          header: { background: '#fc9a55', text: '#ffffff' },
          content: { background: '#f4f4f4', cardBackground: '#ffffff', border: '#E5E5E5', text: '#606060' },
          button: { primary: { background: '#fc9a55', text: '#ffffff' } },
        },
        cssVariables: {
          '--header-bg': '#fc9a55',
          '--header-text': '#ffffff',
          '--sidebar-bg': '#fc9a55',
          '--sidebar-text': '#ffffff',
          '--button-primary-bg': '#fc9a55',
          '--button-primary-text': '#ffffff',
          '--button-primary-hover': '#e88a45',
        },
      };
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    setMessage(null);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };

      // 新 API 格式：使用 key-value 格式，key 为 TEACHER_THEME
      const response = await fetch('/api/site/api-echo-params', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          TEACHER_THEME: JSON.stringify({
            default_theme: config.default_theme,
            staff_theme: config.staff_theme,
          }),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 0 || response.status === 200) {
          setMessage({ type: 'success', text: '配置保存成功！' });
          // 重新加载配置以确保同步
          setTimeout(() => {
            loadConfig();
          }, 500);
        } else {
          throw new Error(result.message || '保存失败');
        }
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '保存配置失败' });
    } finally {
      setSaving(false);
    }
  };

  const updateTheme = (type: 'default_theme' | 'staff_theme', field: string, value: any) => {
    if (!config) return;

    setConfig({
      ...config,
      [type]: {
        ...config[type],
        [field]: value,
      },
    });
  };

  const updateColor = (type: 'default_theme' | 'staff_theme', colorPath: string, value: string) => {
    if (!config) return;

    const theme = config[type];
    const paths = colorPath.split('.');
    const newColors = { ...theme.colors };

    let current: any = newColors;
    for (let i = 0; i < paths.length - 1; i++) {
      if (!current[paths[i]]) {
        current[paths[i]] = {};
      }
      current = current[paths[i]];
    }
    current[paths[paths.length - 1]] = value;

    setConfig({
      ...config,
      [type]: {
        ...theme,
        colors: newColors,
      },
    });
  };

  const updateCssVariable = (type: 'default_theme' | 'staff_theme', variable: string, value: string) => {
    if (!config) return;

    const theme = config[type];
    setConfig({
      ...config,
      [type]: {
        ...theme,
        cssVariables: {
          ...theme.cssVariables,
          [variable]: value,
        },
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <SwatchIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">主题配置</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <span className="ml-3 text-gray-600">加载配置中...</span>
            </div>
          ) : config ? (
            <div className="space-y-8">
              {/* Website 主题配置 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                  Website 主题 (default_theme)
                </h3>
                <ThemeEditor
                  theme={config.default_theme}
                  onChange={(field, value) => updateTheme('default_theme', field, value)}
                  onColorChange={(path, value) => updateColor('default_theme', path, value)}
                  onCssVariableChange={(variable, value) => updateCssVariable('default_theme', variable, value)}
                />
              </div>

              {/* Staff 主题配置 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
                  Staff 主题 (staff_theme)
                </h3>
                <ThemeEditor
                  theme={config.staff_theme}
                  onChange={(field, value) => updateTheme('staff_theme', field, value)}
                  onColorChange={(path, value) => updateColor('staff_theme', path, value)}
                  onCssVariableChange={(variable, value) => updateCssVariable('staff_theme', variable, value)}
                />
              </div>

              {/* 消息提示 */}
              {message && (
                <div
                  className={`flex items-center p-4 rounded-lg ${
                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      保存中...
                    </>
                  ) : (
                    '保存配置'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">加载失败</div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ThemeEditorProps {
  theme: ThemeData;
  onChange: (field: string, value: any) => void;
  onColorChange: (path: string, value: string) => void;
  onCssVariableChange: (variable: string, value: string) => void;
}

function ThemeEditor({ theme, onChange, onColorChange, onCssVariableChange }: ThemeEditorProps) {
  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">主题名称</label>
          <input
            type="text"
            value={theme.name}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <input
            type="text"
            value={theme.description}
            onChange={(e) => onChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* 颜色配置 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">颜色配置</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorInput
            label="Primary Background"
            value={theme.colors.primary.background}
            onChange={(value) => onColorChange('primary.background', value)}
          />
          <ColorInput
            label="Primary Text"
            value={theme.colors.primary.text}
            onChange={(value) => onColorChange('primary.text', value)}
          />
          <ColorInput
            label="Sidebar Background"
            value={theme.colors.sidebar.background}
            onChange={(value) => onColorChange('sidebar.background', value)}
          />
          <ColorInput
            label="Sidebar Text"
            value={theme.colors.sidebar.text}
            onChange={(value) => onColorChange('sidebar.text', value)}
          />
          <ColorInput
            label="Header Background"
            value={theme.colors.header.background}
            onChange={(value) => onColorChange('header.background', value)}
          />
          <ColorInput
            label="Header Text"
            value={theme.colors.header.text}
            onChange={(value) => onColorChange('header.text', value)}
          />
          <ColorInput
            label="Button Primary Background"
            value={theme.colors.button.primary.background}
            onChange={(value) => onColorChange('button.primary.background', value)}
          />
          <ColorInput
            label="Button Primary Text"
            value={theme.colors.button.primary.text}
            onChange={(value) => onColorChange('button.primary.text', value)}
          />
        </div>
      </div>

      {/* CSS 变量配置 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">CSS 变量配置</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(theme.cssVariables).map(([key, value]) => (
            <ColorInput
              key={key}
              label={key}
              value={value}
              onChange={(newValue) => onCssVariableChange(key, newValue)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  const isColorValue = value.startsWith('#') && value.length === 7;
  const isGradient = value.includes('gradient') || value.includes('linear-gradient');
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        {isColorValue && !isGradient && (
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
          />
        )}
        {!isColorValue && !isGradient && (
          <div className="h-10 w-16 border border-gray-300 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">
            非颜色
          </div>
        )}
        {isGradient && (
          <div className="h-10 w-16 border border-gray-300 rounded bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs text-white">
            渐变
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder="输入颜色值或CSS值"
        />
      </div>
    </div>
  );
}
