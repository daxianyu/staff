'use client';

import { useState, useCallback, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { StudentPdfItem } from '@/services/auth';

interface PredictModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPdfItem | null;
  allCourse: string[];
  onConfirm: (params: {
    graduation_date: string;
    class_size: string;
    data: Array<{ alevel: string; date: string; course: string; score: string }>;
  }) => Promise<void>;
}

export default function PredictModal({ isOpen, onClose, student, allCourse, onConfirm }: PredictModalProps) {
  const [graduationDate, setGraduationDate] = useState('');
  const [classSize, setClassSize] = useState('');
  const [data, setData] = useState<Array<{ alevel: string; date: string; course: string; score: string }>>([]);

  // 格式化日期为 YYYY-MM-DD
  const formatDateForInput = useCallback((timestamp: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 当模态框打开时，初始化数据
  useEffect(() => {
    if (isOpen && student) {
      const date = formatDateForInput(student.graduation_date);
      setGraduationDate(date);
      setClassSize('');
      setData([]);
    } else if (!isOpen) {
      setGraduationDate('');
      setClassSize('');
      setData([]);
    }
  }, [isOpen, student, formatDateForInput]);

  const handleAddRow = useCallback(() => {
    setData(prev => [...prev, { alevel: '', date: '', course: '', score: '' }]);
  }, []);

  const handleDeleteRow = useCallback((index: number) => {
    setData(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateRow = useCallback((index: number, field: string, value: string) => {
    setData(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!graduationDate || !classSize) {
      alert('请填写必填项');
      return;
    }
    if (data.length === 0) {
      alert('请至少添加一条成绩数据');
      return;
    }
    if (data.some(item => !item.alevel || !item.date || !item.course || !item.score)) {
      alert('请填写完整的成绩数据');
      return;
    }
    
    await onConfirm({
      graduation_date: graduationDate,
      class_size: classSize,
      data: data,
    });
  }, [graduationDate, classSize, data, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">生成 Expected grades</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Graduation Date *
              </label>
              <input
                type="date"
                value={graduationDate}
                onChange={(e) => setGraduationDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Graduating Class Size *
              </label>
              <input
                type="number"
                value={classSize}
                onChange={(e) => setClassSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                成绩数据 *
              </label>
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                添加行
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ALEVEL</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">课程名</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">成绩</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => (
                    <tr key={`predict-row-${index}`}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.alevel}
                          onChange={(e) => handleUpdateRow(index, 'alevel', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={item.date}
                          onChange={(e) => handleUpdateRow(index, 'date', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          list={`course-list-${index}`}
                          value={item.course}
                          onChange={(e) => handleUpdateRow(index, 'course', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <datalist id={`course-list-${index}`}>
                          {allCourse.map(course => (
                            <option key={course} value={course} />
                          ))}
                        </datalist>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.score}
                          onChange={(e) => handleUpdateRow(index, 'score', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
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
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

