'use client';

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { addReportTime, deleteReportTime, getReportTime } from '@/services/modules/tools';
import { getAllCampus } from '@/services/modules/academics';
import type { Campus } from '@/services/modules/academics';
import type { ReportTimeRecord } from '@/services/modules/tools';
import { CheckCircleIcon, ExclamationCircleIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ReportTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportTimeModal({ isOpen, onClose }: ReportTimeModalProps) {
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [records, setRecords] = useState<ReportTimeRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    campus_id: 0,
    start_day: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadCampusList();
      loadRecords();
    }
  }, [isOpen]);

  const loadCampusList = async () => {
    try {
      const response = await getAllCampus();
      if (response.status === 200 && response.data) {
        setCampusList(response.data);
      }
    } catch (error) {
      console.error('加载校区列表失败:', error);
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await getReportTime();
      if (response.code === 200 && response.data) {
        setRecords(response.data.rows || []);
      }
    } catch (error) {
      console.error('加载记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.campus_id || !formData.start_day) {
      setMessage({ type: 'error', text: '请填写所有必填字段' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await addReportTime({
        campus_id: formData.campus_id,
        start_day: formData.start_day,
      });

      if (response.code === 200) {
        setMessage({ type: 'success', text: '新增成功' });
        setShowAddForm(false);
        setFormData({
          campus_id: 0,
          start_day: '',
        });
        loadRecords();
      } else {
        setMessage({ type: 'error', text: response.message || '新增失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '新增失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!confirm('确定要删除这条记录吗？')) return;

    try {
      const response = await deleteReportTime({ record_id: recordId });
      if (response.code === 200) {
        setMessage({ type: 'success', text: '删除成功' });
        loadRecords();
      } else {
        setMessage({ type: 'error', text: response.message || '删除失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败，请重试' });
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Exam Report开放时间管理" maxWidth="xl">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-md font-medium text-gray-900">时间列表</h4>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            新增
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-md space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                校区 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.campus_id}
                onChange={(e) => setFormData({ ...formData, campus_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
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

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    campus_id: 0,
                    start_day: '',
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? '提交中...' : '确认新增'}
              </button>
            </div>
          </form>
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

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    校区
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    开始日期
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作人
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.record_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.campus_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.start_day}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.operator_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(record.record_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && (
              <p className="text-center text-gray-500 py-8">暂无数据</p>
            )}
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

