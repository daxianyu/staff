'use client';

import { useState } from 'react';
import BaseModal from './BaseModal';
import { freeSearch } from '@/services/modules/tools';
import type { FreeSearchRecord } from '@/services/modules/tools';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface FreeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FreeSearchModal({ isOpen, onClose }: FreeSearchModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [results, setResults] = useState<FreeSearchRecord[]>([]);
  
  const [formData, setFormData] = useState({
    user_type: 0, // 0: 教师, 1: 学生
    query_start: '',
    query_end: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.query_start || !formData.query_end) {
      setMessage({ type: 'error', text: '请填写开始时间和结束时间' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setResults([]);

    try {
      const response = await freeSearch({
        user_type: formData.user_type,
        query_start: formData.query_start,
        query_end: formData.query_end,
      });

      if (response.code === 200 && response.data) {
        setResults(response.data.rows || []);
        setMessage({ type: 'success', text: `查询成功，共找到 ${response.data.total || 0} 条记录` });
      } else {
        setMessage({ type: 'error', text: response.message || '查询失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '查询失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="查询空闲时间" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            用户类型 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.user_type}
            onChange={(e) => setFormData({ ...formData, user_type: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value={0}>教师</option>
            <option value={1}>学生</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            开始时间 <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.query_start}
            onChange={(e) => setFormData({ ...formData, query_start: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            结束时间 <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.query_end}
            onChange={(e) => setFormData({ ...formData, query_end: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
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

        {results.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户类型
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户名称
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.user_type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.user_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={submitting}
          >
            关闭
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? '查询中...' : '查询'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

