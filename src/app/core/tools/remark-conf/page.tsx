'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getRemarkConfSelect,
  getRemarkConfTable,
  addRemarkConf,
  deleteRemarkConf,
  type RemarkConfRecord,
  type RemarkConfSelect
} from '@/services/auth';
import {
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function RemarkConfPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_REMARK_CONF);
  const canEdit = hasPermission(PERMISSIONS.EDIT_REMARK_CONF);

  const [records, setRecords] = useState<RemarkConfRecord[]>([]);
  const [selectData, setSelectData] = useState<RemarkConfSelect | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    exam_center: '',
    conf_type: 0,
    price: 0,
  });

  useEffect(() => {
    if (canView) {
      loadData();
      loadSelectData();
    }
  }, [canView]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getRemarkConfTable();
      if (response.code === 200 && response.data) {
        setRecords(response.data.rows || []);
      }
    } catch (error) {
      console.error('加载Remark配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectData = async () => {
    try {
      const response = await getRemarkConfSelect();
      if (response.code === 200 && response.data) {
        setSelectData(response.data);
      }
    } catch (error) {
      console.error('加载Select清单失败:', error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.exam_center || !formData.conf_type || !formData.price) {
      alert('请填写完整信息');
      return;
    }

    try {
      setSubmitting(true);
      const response = await addRemarkConf(formData);
      if (response.code === 200) {
        setMessage({ type: 'success', text: '新增成功' });
        setShowAddModal(false);
        setFormData({ exam_center: '', conf_type: 0, price: 0 });
        loadData();
      } else {
        setMessage({ type: 'error', text: response.message || '新增失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '新增失败' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!confirm('确定要删除该配置吗？')) return;

    try {
      const response = await deleteRemarkConf(recordId);
      if (response.code === 200) {
        setMessage({ type: 'success', text: '删除成功' });
        loadData();
      } else {
        setMessage({ type: 'error', text: response.message || '删除失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败' });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看Remark费用配置</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Remark费用配置</h1>
            <p className="mt-1 text-sm text-gray-500">对不同考试局和类型的复议费用进行配置</p>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              新增配置
            </button>
          )}
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircleIcon className="h-5 w-5" /> : <ExclamationTriangleIcon className="h-5 w-5" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* PC端表格 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试局</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">暂无数据</td>
                      </tr>
                    ) : (
                      records.map((record, index) => (
                        <tr key={record.record_id || `record-pc-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.exam_center}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.remark_type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{record.price}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${record.in_use === '使用中' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {record.in_use}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.record_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {canEdit && (
                              <button
                                onClick={() => handleDelete(record.record_id)}
                                className="text-red-600 hover:text-red-900"
                                title="删除"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 移动端列表 */}
              <div className="md:hidden divide-y divide-gray-200">
                {records.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">暂无数据</div>
                ) : (
                  records.map((record, index) => (
                    <div key={record.record_id || `record-mobile-${index}`} className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.exam_center} - {record.remark_type}</div>
                          <div className="text-lg font-bold text-blue-600">¥{record.price}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${record.in_use === '使用中' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {record.in_use}
                          </span>
                          {canEdit && (
                            <button
                              onClick={() => handleDelete(record.record_id)}
                              className="text-red-600 p-1"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 flex justify-between">
                        <span>操作人: {record.record_name}</span>
                        <span>{record.create_time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 新增模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">新增Remark配置</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">考试局</label>
                <select
                  value={formData.exam_center}
                  onChange={(e) => setFormData({ ...formData, exam_center: e.target.value, conf_type: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">请选择考试局</option>
                  {selectData?.exam_center?.map((center, index) => (
                    <option key={`${center}-${index}`} value={center}>{center}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                <select
                  value={formData.conf_type}
                  onChange={(e) => setFormData({ ...formData, conf_type: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value={0}>请选择类型</option>
                  {(() => {
                    const currentRemarkType = formData.exam_center === 'CAIE' 
                      ? selectData?.remark3_type 
                      : (formData.exam_center === 'Edexcel' ? selectData?.remark2_type : selectData?.remark_type);
                    
                    return Object.entries(currentRemarkType || {}).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ));
                  })()}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="请输入价格"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '确认新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
