'use client';

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { remarkConfAdd, getRemarkConf } from '@/services/modules/tools';
import type { RemarkConfRecord } from '@/services/modules/tools';
import { CheckCircleIcon, ExclamationCircleIcon, PlusIcon } from '@heroicons/react/24/outline';

interface RemarkConfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXAM_CENTERS = ['Edexcel', 'CIE', 'AQA', 'OCR'];
const REMARK_TYPES = [
  { value: 1, label: '看卷' },
  { value: 2, label: '看卷+复议' },
  { value: 3, label: '复议' },
];

export default function RemarkConfModal({ isOpen, onClose }: RemarkConfModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [records, setRecords] = useState<RemarkConfRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    exam_center: '',
    conf_type: 0,
    price: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadRecords();
    }
  }, [isOpen]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await getRemarkConf();
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
    
    if (!formData.exam_center || !formData.conf_type || !formData.price) {
      setMessage({ type: 'error', text: '请填写所有必填字段' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await remarkConfAdd({
        exam_center: formData.exam_center,
        conf_type: formData.conf_type,
        price: formData.price,
      });

      if (response.code === 200) {
        setMessage({ type: 'success', text: '新增成功' });
        setShowAddForm(false);
        setFormData({
          exam_center: '',
          conf_type: 0,
          price: 0,
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

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Remark费用配置" maxWidth="xl">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-md font-medium text-gray-900">配置列表</h4>
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
                考试局 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.exam_center}
                onChange={(e) => setFormData({ ...formData, exam_center: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">请选择考试局</option>
                {EXAM_CENTERS.map((center) => (
                  <option key={center} value={center}>
                    {center}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                类型 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.conf_type}
                onChange={(e) => setFormData({ ...formData, conf_type: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={0}>请选择类型</option>
                {REMARK_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                价格 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="请输入价格"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    exam_center: '',
                    conf_type: 0,
                    price: 0,
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
                    考试局
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    价格
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作人
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.exam_center}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.remark_type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.price}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.in_use}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.record_name}
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

