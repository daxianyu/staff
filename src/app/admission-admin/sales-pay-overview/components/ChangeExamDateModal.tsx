'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { PaymentDetail } from '@/services/auth';

interface ChangeExamDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentDetail: PaymentDetail | null;
  onConfirm: (params: {
    sales_id: number;
    old_exam_id: number;
    new_exam_id: number;
  }) => Promise<void>;
}

export default function ChangeExamDateModal({
  isOpen,
  onClose,
  paymentDetail,
  onConfirm,
}: ChangeExamDateModalProps) {
  const [newExamId, setNewExamId] = useState<number | ''>('');

  // 当模态框打开时，重置表单
  useEffect(() => {
    if (isOpen) {
      setNewExamId('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!paymentDetail || !paymentDetail.detail) return;
    if (newExamId === '' || newExamId === 0) {
      alert('请选择新的考试场次');
      return;
    }

    await onConfirm({
      sales_id: paymentDetail.detail.sales_id,
      old_exam_id: paymentDetail.detail.exam_id,
      new_exam_id: Number(newExamId),
    });
  };

  if (!isOpen || !paymentDetail) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">修改招生报名的考试日期</h3>
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
              当前考试场次
            </label>
            <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
              {paymentDetail.detail?.exam_desc || '-'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择新的考试场次 *
            </label>
            <select
              value={newExamId}
              onChange={(e) => setNewExamId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择</option>
              {paymentDetail.exam_setting && paymentDetail.exam_setting.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.exam_desc}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-6 border-t">
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

