'use client';

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { copyRight } from '@/services/modules/tools';
import { getAllStaffList } from '@/services/modules/staff';
import type { Staff } from '@/services/modules/staff';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface CopyRightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CopyRightModal({ isOpen, onClose }: CopyRightModalProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    from_staff_id: 0,
    to_staff_id: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadStaffList();
    }
  }, [isOpen]);

  const loadStaffList = async () => {
    try {
      setLoading(true);
      const response = await getAllStaffList();
      if (response.code === 200 && Array.isArray(response.data)) {
        setStaffList(response.data);
      }
    } catch (error) {
      console.error('加载员工列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.from_staff_id || !formData.to_staff_id) {
      setMessage({ type: 'error', text: '请选择源员工和目标员工' });
      return;
    }

    if (formData.from_staff_id === formData.to_staff_id) {
      setMessage({ type: 'error', text: '源员工和目标员工不能相同' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await copyRight({
        from_staff_id: formData.from_staff_id,
        to_staff_id: formData.to_staff_id,
      });

      if (response.code === 200) {
        setMessage({ type: 'success', text: '权限复制成功' });
        setTimeout(() => {
          onClose();
          setFormData({
            from_staff_id: 0,
            to_staff_id: 0,
          });
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.message || '权限复制失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '权限复制失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="权限复制">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            选择要复制的老师权限 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.from_staff_id}
            onChange={(e) => setFormData({ ...formData, from_staff_id: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          >
            <option value={0}>请选择源员工</option>
            {staffList.map((staff) => (
              <option key={staff.staff_id} value={staff.staff_id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            需要权限的老师 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.to_staff_id}
            onChange={(e) => setFormData({ ...formData, to_staff_id: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          >
            <option value={0}>请选择目标员工</option>
            {staffList.map((staff) => (
              <option key={staff.staff_id} value={staff.staff_id}>
                {staff.name}
              </option>
            ))}
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
            {submitting ? '复制中...' : '确认复制'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

