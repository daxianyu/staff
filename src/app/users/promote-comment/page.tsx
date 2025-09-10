'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getStaffPromote, 
  updateStaffPromoteComment,
  type StaffPromoteItem,
  type StaffPromoteResponse
} from '@/services/auth';
import { 
  UserGroupIcon, 
  ExclamationTriangleIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function PromoteCommentPage() {
  const { user, hasPermission } = useAuth();
  const [data, setData] = useState<StaffPromoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<StaffPromoteItem | null>(null);
  const [editContent, setEditContent] = useState('');

  const canView = hasPermission(PERMISSIONS.VIEW_PROMOTE_COMMENT);
  const canEdit = hasPermission(PERMISSIONS.EDIT_PROMOTE_COMMENT);

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getStaffPromote();
      if (result.code === 200) {
        setData(result.data?.rows || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: StaffPromoteItem) => {
    setSelectedRecord(item);
    setEditContent(item.comment);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRecord || !canEdit) return;

    try {
      const result = await updateStaffPromoteComment({
        record_id: selectedRecord.record_id,
        comment: editContent
      });

      if (result.code === 200) {
        alert('评论更新成功');
        setShowEditModal(false);
        setSelectedRecord(null);
        setEditContent('');
        loadData();
      } else {
        alert(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败');
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
          <h1 className="text-2xl font-bold text-gray-900">Promote Comment</h1>
          <p className="text-gray-600 mt-1">晋升评价管理</p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">共 {data.length} 条记录</span>
            </div>
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
                      员工姓名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      员工生效日期
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      教师生效日期
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      等级
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      员工下一级
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      教师等级
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      教师下一级
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      教师课时
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      评价人
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      评论
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
                        <div className="flex items-center">
                          <UserGroupIcon className="h-5 w-5 text-blue-600 mr-2" />
                          {item.staff_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.staff_effect_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.teacher_effect_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.staff_next_level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.teacher_level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.teacher_next_level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.teacher_hours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.promote_staff_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={item.comment}>
                          {item.comment || '-'}
                        </div>
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <PencilIcon className="h-4 w-4" />
                            编辑
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {data.length === 0 && (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">暂无晋升评价记录</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 编辑模态框 */}
        {showEditModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">编辑晋升评价</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      员工：<strong>{selectedRecord.staff_name}</strong>
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      评价人：<strong>{selectedRecord.promote_staff_name}</strong>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      评价评论
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="请输入评价评论..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
