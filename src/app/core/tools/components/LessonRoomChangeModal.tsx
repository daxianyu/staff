'use client';

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { lessonRoomChange } from '@/services/modules/tools';
import { getAllCampus } from '@/services/modules/academics';
import type { Campus } from '@/services/modules/academics';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface LessonRoomChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LessonRoomChangeModal({ isOpen, onClose }: LessonRoomChangeModalProps) {
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    campus_id: 0,
    start_day: '',
    end_day: '',
    max_num: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadCampusList();
    }
  }, [isOpen]);

  const loadCampusList = async () => {
    try {
      setLoading(true);
      const response = await getAllCampus();
      if (response.status === 200 && response.data) {
        setCampusList(response.data);
      }
    } catch (error) {
      console.error('加载校区列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.campus_id || !formData.start_day || !formData.end_day) {
      setMessage({ type: 'error', text: '请填写所有必填字段' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await lessonRoomChange({
        campus_id: formData.campus_id,
        start_day: formData.start_day,
        end_day: formData.end_day,
        max_num: formData.max_num,
      });

      if (response.code === 200) {
        setMessage({ type: 'success', text: '调整成功' });
        setTimeout(() => {
          onClose();
          setFormData({
            campus_id: 0,
            start_day: '',
            end_day: '',
            max_num: 0,
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
    <BaseModal isOpen={isOpen} onClose={onClose} title="调整房间">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            校区 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.campus_id}
            onChange={(e) => setFormData({ ...formData, campus_id: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          >
            <option value={0}>请选择校区</option>
            {campusList.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            开始日期 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.start_day}
            onChange={(e) => setFormData({ ...formData, start_day: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            结束日期 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.end_day}
            onChange={(e) => setFormData({ ...formData, end_day: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

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

