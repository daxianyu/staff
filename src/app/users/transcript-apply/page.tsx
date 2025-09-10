'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getTranscriptApply, 
  getTranscriptApplySelect,
  addTranscriptApply,
  revokeTranscriptApply,
  type TranscriptApplyItem,
  type TranscriptApplyResponse,
  type TranscriptApplySelectResponse
} from '@/services/auth';
import { 
  PlusIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function TranscriptApplyPage() {
  const { user, hasPermission } = useAuth();
  const [data, setData] = useState<TranscriptApplyItem[]>([]);
  const [selectOptions, setSelectOptions] = useState<TranscriptApplySelectResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TranscriptApplyItem | null>(null);
  const [formData, setFormData] = useState({
    student_id: '',
    exam_select: '',
    exam_season: '',
    apply_desc: '',
    file_type: ''
  });

  const canView = hasPermission(PERMISSIONS.VIEW_TRANSCRIPT_APPLY);
  const canEdit = hasPermission(PERMISSIONS.EDIT_TRANSCRIPT_APPLY);

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [applyResult, selectResult] = await Promise.all([
        getTranscriptApply(),
        getTranscriptApplySelect()
      ]);

      if (applyResult.code === 200) {
        setData(applyResult.data?.rows || []);
      }
      if (selectResult.code === 200) {
        setSelectOptions(selectResult.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApply = async () => {
    if (!canEdit) return;

    try {
      const result = await addTranscriptApply({
        student_id: parseInt(formData.student_id),
        exam_select: formData.exam_select,
        exam_season: formData.exam_season,
        apply_desc: formData.apply_desc,
        file_type: parseInt(formData.file_type)
      });

      if (result.code === 200) {
        alert('申请提交成功');
        setShowAddModal(false);
        setFormData({
          student_id: '',
          exam_select: '',
          exam_season: '',
          apply_desc: '',
          file_type: ''
        });
        loadData();
      } else {
        alert(result.message || '申请提交失败');
      }
    } catch (error) {
      console.error('申请提交失败:', error);
      alert('申请提交失败');
    }
  };

  const handleRevoke = async () => {
    if (!selectedRecord || !canEdit) return;

    try {
      const result = await revokeTranscriptApply(selectedRecord.record_id);
      if (result.code === 200) {
        alert('撤销成功');
        setShowRevokeModal(false);
        setSelectedRecord(null);
        loadData();
      } else {
        alert(result.message || '撤销失败');
      }
    } catch (error) {
      console.error('撤销失败:', error);
      alert('撤销失败');
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-800';
      case 1: return 'bg-green-100 text-green-800';
      case -1: return 'bg-red-100 text-red-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Transcript Apply</h1>
          <p className="text-gray-600 mt-1">成绩单申请管理</p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">共 {data.length} 条申请</span>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                新增申请
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
                      考试类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      考试季
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      文件类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      管理员
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请描述
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      拒绝原因
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
                        {item.exam_select}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.exam_season}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.file_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.manager_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={item.apply_desc}>
                          {item.apply_desc || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={item.reject_reason}>
                          {item.reject_reason || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.create_time}
                      </td>
                      {canEdit && item.status === 0 && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedRecord(item);
                              setShowRevokeModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          >
                            <TrashIcon className="h-4 w-4" />
                            撤销
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {data.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无申请记录</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 新增申请模态框 */}
        {showAddModal && selectOptions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">新增成绩单申请</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      学生
                    </label>
                    <select
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">请选择学生</option>
                      {selectOptions.students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      考试类型
                    </label>
                    <select
                      value={formData.exam_select}
                      onChange={(e) => setFormData({ ...formData, exam_select: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">请选择考试类型</option>
                      {selectOptions.exam_select.map((exam) => (
                        <option key={exam} value={exam}>
                          {exam}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      考试季
                    </label>
                    <select
                      value={formData.exam_season}
                      onChange={(e) => setFormData({ ...formData, exam_season: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">请选择考试季</option>
                      {selectOptions.exam_season.map((season) => (
                        <option key={season} value={season}>
                          {season}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      文件类型
                    </label>
                    <select
                      value={formData.file_type}
                      onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">请选择文件类型</option>
                      {selectOptions.file_type.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    申请描述
                  </label>
                  <textarea
                    value={formData.apply_desc}
                    onChange={(e) => setFormData({ ...formData, apply_desc: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入申请描述"
                  />
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
                  onClick={handleAddApply}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  提交申请
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 撤销确认模态框 */}
        {showRevokeModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      确认撤销申请
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        确定要撤销学生 <strong>{selectedRecord.student_name}</strong> 的成绩单申请吗？
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleRevoke}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  确认撤销
                </button>
                <button
                  onClick={() => setShowRevokeModal(false)}
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
