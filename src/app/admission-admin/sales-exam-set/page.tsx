'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  getExamConfigSelect,
  addExamConfig,
  getExamConfigTable,
  deleteExamConfig,
  type ExamConfig,
  type SelectOption,
} from '@/services/auth';

export default function SalesExamSetPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.MANAGE_EXAM_CONFIG);

  // 状态管理
  const [examSessions, setExamSessions] = useState<ExamConfig[]>([]);
  const [examTypeOptions, setExamTypeOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ExamConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // 权限检查页面
  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限管理考试设置</p>
        </div>
      </div>
    );
  }

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionResult, selectResult] = await Promise.all([
        getExamConfigTable(),
        getExamConfigSelect(),
      ]);
      if (sessionResult.code === 200 && sessionResult.data) {
        setExamSessions(sessionResult.data.rows);
      }
      if (selectResult.code === 200 && selectResult.data) {
        // selectResult.data.exam_type 是 Record<number, string>，需要转换为 SelectOption[]
        const examTypeOptions = Object.entries(selectResult.data.exam_type || {}).map(([id, name]) => ({
          id: parseInt(id),
          name: name as string,
        }));
        setExamTypeOptions(examTypeOptions);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 生成时间选项（每30分钟一个，从00:00到23:30）
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // 打开添加模态框
  const handleAdd = () => {
    setFormData({ price: 500 }); // 默认费用500
    setShowAddModal(true);
  };

  // 打开删除确认模态框
  const handleDeleteClick = (config: ExamConfig) => {
    setSelectedConfig(config);
    setShowDeleteModal(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (submitting) return; // 防止重复提交
    
    try {
      setSubmitting(true);
      
      // 合并考试日期和时间
      const examDate = formData.exam_date || '';
      const examTime = formData.exam_time || '';
      // time 输入框返回的是 HH:MM 格式，需要转换为 HH:MM:SS
      const examTimeWithSeconds = examTime ? `${examTime}:00` : '00:00:00';
      const examDateTime = examDate && examTime ? `${examDate} ${examTimeWithSeconds}` : '';
      
      const submitData = {
        exam_desc: formData.exam_desc || '',
        start_day: formData.start_day || '',
        end_day: formData.end_day || '',
        exam_time: examDateTime,
        price: formData.price ? parseInt(formData.price) : 0,
        exam_type: formData.exam_type ? parseInt(formData.exam_type) : 0,
      };
      
      const result = await addExamConfig(submitData);
      if (result.code === 200) {
        alert('添加成功');
        setShowAddModal(false);
        setFormData({ price: 500 });
        loadData();
      } else {
        alert('添加失败: ' + result.message);
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!selectedConfig) return;
    
    try {
      const result = await deleteExamConfig(selectedConfig.record_id);
      if (result.code === 200) {
        alert('删除成功');
        setShowDeleteModal(false);
        setSelectedConfig(null);
        loadData();
      } else {
        alert('删除失败: ' + result.message);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sales Exam Set</h1>
          <p className="mt-2 text-sm text-gray-600">管理考试场次设置</p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              新增考试场次
            </button>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desc</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Start Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay End Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Online Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {examSessions.map((session) => (
                    <tr key={session.record_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.record_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.exam_desc || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.start_day || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.end_day || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.exam_time || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.exam_type || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.price !== undefined ? session.price : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteClick(session)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                          title="删除"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                  {examSessions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 添加模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">新增考试场次</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 考试说明 - 占满一行 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      考试说明 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.exam_desc || ''}
                      onChange={(e) => setFormData({ ...formData, exam_desc: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入考试说明"
                      required
                    />
                  </div>
                  
                  {/* 缴费开始日期 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      缴费开始日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.start_day || ''}
                      onChange={(e) => setFormData({ ...formData, start_day: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* 缴费结束日期 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      缴费结束日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.end_day || ''}
                      onChange={(e) => setFormData({ ...formData, end_day: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* 考试日期 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      考试日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.exam_date || ''}
                      onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* 考试时分秒 - 下拉菜单 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      考试时分秒 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.exam_time || ''}
                      onChange={(e) => setFormData({ ...formData, exam_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">请选择时间</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 考试类型 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      考试类型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.exam_type || ''}
                      onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">请选择考试类型</option>
                      {examTypeOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 考试费用 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      考试费用 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price || 500}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 500 : parseInt(e.target.value) || 0;
                        setFormData({ ...formData, price: value });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入考试费用"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ price: 500 });
                  }}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '提交中...' : '确认'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteModal && selectedConfig && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg font-medium text-gray-900">删除确认</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      确定要删除考试场次 "{selectedConfig.exam_desc || selectedConfig.record_id}" 吗？此操作不可撤销。
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedConfig(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

