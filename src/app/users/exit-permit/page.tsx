'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getStaffOutTable, 
  updateDoorFlag, 
  deleteOutRecord,
  batchAddOutRecord,
  updateStudentOutInfo,
  type ExitPermitItem,
  type ExitPermitResponse 
} from '@/services/auth';
import { 
  PlayIcon, 
  TrashIcon, 
  PlusIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function ExitPermitPage() {
  const { user, hasPermission } = useAuth();
  const [data, setData] = useState<ExitPermitItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ExitPermitItem | null>(null);
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    student_ids: ''
  });

  const canView = hasPermission(PERMISSIONS.VIEW_EXIT_PERMIT);
  const canEdit = hasPermission(PERMISSIONS.EDIT_EXIT_PERMIT);

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getStaffOutTable();
      if (result.code === 200) {
        setData(result.data?.rows || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDoor = async (record: ExitPermitItem) => {
    if (!canEdit) return;
    
    try {
      const result = await updateDoorFlag({
        record_id: record.record_id,
        open_door_status: 1
      });

      if (result.code === 200) {
        alert(result.data || '开门成功');
        loadData();
      } else {
        alert(result.message || '开门失败');
      }
    } catch (error) {
      console.error('开门失败:', error);
      alert('开门失败');
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord || !canEdit) return;

    try {
      const result = await deleteOutRecord(selectedRecord.record_id);
      if (result.code === 200) {
        alert('删除成功');
        setShowDeleteModal(false);
        setSelectedRecord(null);
        loadData();
      } else {
        alert(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const handleBatchAdd = async () => {
    if (!canEdit) return;

    try {
      const result = await batchAddOutRecord(formData);
      if (result.code === 200) {
        alert('批量添加成功');
        setShowAddModal(false);
        setFormData({ start_time: '', end_time: '', student_ids: '' });
        loadData();
      } else {
        alert(result.message || '批量添加失败');
      }
    } catch (error) {
      console.error('批量添加失败:', error);
      alert('批量添加失败');
    }
  };

  const handleStatusChange = async (record: ExitPermitItem, status: number) => {
    if (!canEdit) return;

    try {
      const result = await updateStudentOutInfo({
        record_id: record.record_id,
        status: status
      });

      if (result.code === 200) {
        alert('状态更新成功');
        loadData();
      } else {
        alert(result.message || '状态更新失败');
      }
    } catch (error) {
      console.error('状态更新失败:', error);
      alert('状态更新失败');
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-red-100 text-red-800';
      case 3: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Exit Permit</h1>
          <p className="text-gray-600 mt-1">外出申请管理</p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">共 {data.length} 条记录</span>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                批量添加
              </button>
            )}
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学生姓名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      导师
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      备注
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      开始时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      结束时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    {canEdit && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item) => (
                    <tr key={item.record_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.staff_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.note}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.start_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.end_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.create_time}
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {item.status === 1 && (
                              <button
                                onClick={() => handleOpenDoor(item)}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1"
                              >
                                <PlayIcon className="h-4 w-4" />
                                开门
                              </button>
                            )}
                            {item.status === 1 && (
                              <button
                                onClick={() => handleStatusChange(item, 2)}
                                className="text-red-600 hover:text-red-900 flex items-center gap-1"
                              >
                                <XMarkIcon className="h-4 w-4" />
                                拒绝
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedRecord(item);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            >
                              <TrashIcon className="h-4 w-4" />
                              删除
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {data.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无数据</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 批量添加模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">批量添加外出申请</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      开始时间
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      结束时间
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      学生ID (逗号分隔)
                    </label>
                    <input
                      type="text"
                      value={formData.student_ids}
                      onChange={(e) => setFormData({ ...formData, student_ids: e.target.value })}
                      placeholder="例如: 1,2,3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleBatchAdd}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      确认删除
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        确定要删除学生 <strong>{selectedRecord.student_name}</strong> 的外出申请吗？此操作不可撤销。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  删除
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
