'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { PaymentDetail } from '@/services/auth';

interface ChangeApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentDetail: PaymentDetail | null;
  payId: number;
  onConfirm: (params: {
    sales_id: number;
    pay_id: number;
    campus_id: number;
    study_year: string;
    paper_type: string;
    math_type: string;
  }) => Promise<void>;
}

export default function ChangeApplyModal({
  isOpen,
  onClose,
  paymentDetail,
  payId,
  onConfirm,
}: ChangeApplyModalProps) {
  const [formData, setFormData] = useState({
    campus_id: 0,
    study_year: '',
    paper_type: '',
    math_type: '',
  });

  // 当模态框打开时，初始化表单数据
  useEffect(() => {
    if (isOpen && paymentDetail?.apply_info) {
      setFormData({
        campus_id: paymentDetail.apply_info.campus_id || 0,
        study_year: paymentDetail.apply_info.study_year || '',
        paper_type: paymentDetail.apply_info.paper_type || '',
        math_type: paymentDetail.apply_info.math_type || '',
      });
    }
  }, [isOpen, paymentDetail]);

  const handleConfirm = async () => {
    if (!paymentDetail || !paymentDetail.detail) return;
    if (!formData.campus_id || !formData.study_year || !formData.paper_type || !formData.math_type) {
      alert('请填写完整的报考信息');
      return;
    }

    await onConfirm({
      sales_id: paymentDetail.detail.sales_id,
      pay_id: payId,
      campus_id: formData.campus_id,
      study_year: formData.study_year,
      paper_type: formData.paper_type,
      math_type: formData.math_type,
    });
  };

  if (!isOpen || !paymentDetail) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">修改报考信息</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              校区 *
            </label>
            <select
              value={formData.campus_id}
              onChange={(e) => setFormData(prev => ({ ...prev, campus_id: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="0">请选择</option>
              {paymentDetail.campus_list && paymentDetail.campus_list.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              年制 *
            </label>
            <select
              value={formData.study_year}
              onChange={(e) => setFormData(prev => ({ ...prev, study_year: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择</option>
              {paymentDetail.study_year_list && paymentDetail.study_year_list.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              试卷类型 *
            </label>
            <select
              value={formData.paper_type}
              onChange={(e) => setFormData(prev => ({ ...prev, paper_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择</option>
              {paymentDetail.paper_type_list && paymentDetail.paper_type_list.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              数学类型 *
            </label>
            <select
              value={formData.math_type}
              onChange={(e) => setFormData(prev => ({ ...prev, math_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择</option>
              {paymentDetail.math_type_list && paymentDetail.math_type_list.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

