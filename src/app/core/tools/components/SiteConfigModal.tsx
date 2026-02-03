'use client';

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { getSiteConfig, updateSiteConfig } from '@/services/modules/tools';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface SiteConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SiteConfig {
  sales_simplified_mode: boolean; // sales 简化模式：发送合同时只发送服务协议、list 中只显示一个按钮、预览时只显示一个 iframe
}

export default function SiteConfigModal({ isOpen, onClose }: SiteConfigModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<SiteConfig>({
    sales_simplified_mode: false,
  });

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await getSiteConfig();
      if (response.code === 200 && response.data) {
        setFormData({
          sales_simplified_mode: response.data.sales_simplified_mode ?? false,
        });
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      setMessage({ type: 'error', text: '加载配置失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await updateSiteConfig(formData);

      if (response.code === 200) {
        setMessage({ type: 'success', text: '配置保存成功' });
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.message || '配置保存失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '配置保存失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="网站配置" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="sales_simplified_mode"
                type="checkbox"
                checked={formData.sales_simplified_mode}
                onChange={(e) => setFormData({ ...formData, sales_simplified_mode: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading || submitting}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="sales_simplified_mode" className="font-medium text-gray-700">
                Sales 简化模式
              </label>
              <p className="text-gray-500 mt-1">
                启用后，将同时应用以下设置：
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>发送合同时只发送服务协议，不发送咨询协议</li>
                  <li>Sales 列表页面只显示一个操作按钮</li>
                  <li>合同预览时只显示一个 iframe（服务协议），不显示咨询协议</li>
                </ul>
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={submitting || loading}
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting || loading}
          >
            {submitting ? '保存中...' : '保存配置'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
