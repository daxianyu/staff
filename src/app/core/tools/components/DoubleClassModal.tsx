'use client';

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { getDoubleClass } from '@/services/modules/tools';
import type { DoubleClassRecord } from '@/services/modules/tools';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface DoubleClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DoubleClassModal({ isOpen, onClose }: DoubleClassModalProps) {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<DoubleClassRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDoubleClasses();
    }
  }, [isOpen]);

  const loadDoubleClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDoubleClass();

      if (response.code === 200 && response.data) {
        setClasses(response.data.rows || []);
      } else {
        setError(response.message || '获取列表失败');
      }
    } catch (error) {
      setError('获取列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="双倍课时费class列表" maxWidth="xl">
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-800">
            <ExclamationCircleIcon className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : classes.length === 0 ? (
          <p className="text-center text-gray-500 py-8">暂无数据</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    校区
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    班级名称
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classes.map((item) => (
                  <tr key={item.record_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.record_id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.campus_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.class_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            关闭
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

