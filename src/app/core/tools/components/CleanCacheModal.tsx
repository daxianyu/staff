'use client';

import { useState } from 'react';
import BaseModal from './BaseModal';
import { cleanCache } from '@/services/modules/tools';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface CleanCacheModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CleanCacheModal({ isOpen, onClose }: CleanCacheModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await cleanCache();

      if (response.code === 200) {
        setMessage({ type: 'success', text: '缓存清除成功' });
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.message || '清除缓存失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '清除缓存失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="清除缓存">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          此操作将清除所有页面缓存数据，确保数据及时更新。是否继续？
        </p>

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
            disabled={submitting}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? '清除中...' : '确认清除'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

