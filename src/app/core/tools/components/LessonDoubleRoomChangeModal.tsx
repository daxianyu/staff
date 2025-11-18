'use client';

import { useState } from 'react';
import BaseModal from './BaseModal';
import { lessonDoubleRoomChange } from '@/services/modules/tools';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface LessonDoubleRoomChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LessonDoubleRoomChangeModal({ isOpen, onClose }: LessonDoubleRoomChangeModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    max_num: 0,
    order: 1, // 1: 正序, 0: 逆序
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.max_num === 0) {
      setMessage({ type: 'error', text: '请输入size和学生人数的差值' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await lessonDoubleRoomChange({
        max_num: formData.max_num,
        order: formData.order,
      });

      if (response.code === 200) {
        setMessage({ type: 'success', text: '调整成功' });
        setTimeout(() => {
          onClose();
          setFormData({
            max_num: 0,
            order: 1,
          });
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.message || '调整失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '调整失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="调整重复房间">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            size和学生人数的差值 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.max_num || ''}
            onChange={(e) => setFormData({ ...formData, max_num: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="例如: 5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            排序方式 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value={1}>正序</option>
            <option value={0}>逆序</option>
          </select>
        </div>

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
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? '调整中...' : '确认调整'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

