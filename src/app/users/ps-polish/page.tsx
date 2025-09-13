'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getPolishTable, 
  getSubmitPolishTable,
  getPolishSelect,
  addPaperPolish,
  updatePolishStatus,
  type PSPolishItem,
  type PSPolishResponse,
  type PSPolishSelectResponse
} from '@/services/auth';
import { 
  PlusIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// 状态常量定义
const POLISH_STATUS = {
  0: "申请中",
  1: "完成", 
  2: "驳回",
  3: "同意",
  "-1": "撤回",
};

const EVALUATE_STATUS = {
  0: "未评价",
  1: "满意", 
  2: "不满意"
};

export default function PSPolishPage() {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'received' | 'submitted'>('received');
  const [receivedData, setReceivedData] = useState<PSPolishItem[]>([]);
  const [submittedData, setSubmittedData] = useState<PSPolishItem[]>([]);
  const [selectOptions, setSelectOptions] = useState<PSPolishSelectResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PSPolishItem | null>(null);
  const [formData, setFormData] = useState({
    student_id: '',
    teacher_id: '',
    school_type: '',
    ps_type: '',
    words: '',
    major: '',
    note: ''
  });
  const [statusForm, setStatusForm] = useState({
    status: '',
    reject_reason: '',
    evaluate_status: '',
    unhappy: ''
  });

  const canView = hasPermission(PERMISSIONS.VIEW_PS_POLISH);
  const canEdit = hasPermission(PERMISSIONS.EDIT_PS_POLISH);

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [receivedResult, submittedResult, selectResult] = await Promise.all([
        getPolishTable(),
        getSubmitPolishTable(),
        getPolishSelect()
      ]);

      if (receivedResult.code === 200) {
        setReceivedData(receivedResult.data?.rows || []);
      }
      if (submittedResult.code === 200) {
        setSubmittedData(submittedResult.data?.rows || []);
      }
      if (selectResult.code === 200) {
        setSelectOptions(selectResult.data || null);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolish = async () => {
    if (!canEdit) return;

    try {
      const result = await addPaperPolish({
        student_id: parseInt(formData.student_id),
        teacher_id: parseInt(formData.teacher_id),
        school_type: formData.school_type,
        ps_type: formData.ps_type,
        words: parseInt(formData.words),
        major: formData.major,
        note: formData.note
      });

      if (result.code === 200) {
        alert('添加成功');
        setShowAddModal(false);
        setFormData({
          student_id: '',
          teacher_id: '',
          school_type: '',
          ps_type: '',
          words: '',
          major: '',
          note: ''
        });
        loadData();
      } else {
        alert(result.message || '添加失败');
      }
    } catch (error) {
      console.error('添加失败:', error);
      alert('添加失败');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedRecord || !canEdit) return;

    try {
      const params: any = {
        record_id: selectedRecord.record_id
      };

      // 被邀请列表的处理逻辑
      if (activeTab === 'received') {
        if (statusForm.status === '3') {
          // 同意：POLISH_STATUS改成3，reject_reason空字符串或不传
          params.status = 3;
          if (statusForm.reject_reason) {
            params.reject_reason = statusForm.reject_reason;
          }
        } else if (statusForm.status === '2') {
          // 拒绝：POLISH_STATUS改成2，reject_reason必传
          if (!statusForm.reject_reason.trim()) {
            alert('拒绝时必须填写拒绝原因');
            return;
          }
          params.status = 2;
          params.reject_reason = statusForm.reject_reason;
        }
      } 
      // 发出邀请列表的处理逻辑
      else if (activeTab === 'submitted') {
        // 只有在POLISH_STATUS=1且EVALUATE_STATUS=0时才能评价
        if (selectedRecord.status === 1 && selectedRecord.evaluate_status === 0) {
          if (statusForm.evaluate_status === '1') {
            // 满意：POLISH_STATUS改成1，EVALUATE_STATUS改成1
            params.status = 1;
            params.evaluate_status = 1;
          } else if (statusForm.evaluate_status === '2') {
            // 不满意：POLISH_STATUS改成1，EVALUATE_STATUS改成2，需要写原因
            if (!statusForm.unhappy.trim()) {
              alert('不满意时必须填写原因');
              return;
            }
            params.status = 1;
            params.evaluate_status = 2;
            params.unhappy = statusForm.unhappy;
          }
        }
      }

      const result = await updatePolishStatus(params);

      if (result.code === 200) {
        alert('状态更新成功');
        setShowStatusModal(false);
        setSelectedRecord(null);
        setStatusForm({
          status: '',
          reject_reason: '',
          evaluate_status: '',
          unhappy: ''
        });
        loadData();
      } else {
        alert(result.message || '状态更新失败');
      }
    } catch (error) {
      console.error('状态更新失败:', error);
      alert('状态更新失败');
    }
  };

  // 完成处理（将POLISH_STATUS从3改为1）
  const handleComplete = async (record: PSPolishItem) => {
    if (!canEdit) return;

    try {
      const result = await updatePolishStatus({
        record_id: record.record_id,
        status: 1
      });

      if (result.code === 200) {
        alert('完成处理成功');
        loadData();
      } else {
        alert(result.message || '完成处理失败');
      }
    } catch (error) {
      console.error('完成处理失败:', error);
      alert('完成处理失败');
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-800';
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEvaluateStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-gray-100 text-gray-800';
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentData = activeTab === 'received' ? receivedData : submittedData;

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
          <h1 className="text-2xl font-bold text-gray-900">PS Polish</h1>
          <p className="text-gray-600 mt-1">文件润色管理</p>
        </div>

        {/* 标签页 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('received')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'received'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                收到的邀请 ({receivedData.length})
              </button>
              <button
                onClick={() => setActiveTab('submitted')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'submitted'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                我提交的邀请 ({submittedData.length})
              </button>
            </nav>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">共 {currentData.length} 条记录</span>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                新增邀请
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
                      校区
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      邀请润色的老师
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      提交者
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请院校
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      文件类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      字数要求
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请专业
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      备注
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      不通过原因
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      评价状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      评价说明
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      发起时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      更新时间
                    </th>
                    {canEdit && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.map((item) => (
                    <tr key={item.record_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.campus_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.teacher_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.submit_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.school_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.ps_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.words}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.major}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.note || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.note || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEvaluateStatusColor(item.evaluate_status)}`}>
                          {item.evaluate_status_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.evaluate_info || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.create_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.update_time || '-'}
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {/* 被邀请列表：只有在POLISH_STATUS=0时才显示处理按钮 */}
                            {activeTab === 'received' && item.status === 0 && (
                              <button
                                onClick={() => {
                                  setSelectedRecord(item);
                                  setShowStatusModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              >
                                处理
                              </button>
                            )}
                            
                            {/* 被邀请列表：POLISH_STATUS=3时显示完成按钮 */}
                            {activeTab === 'received' && item.status === 3 && (
                              <button
                                onClick={() => handleComplete(item)}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1"
                              >
                                完成
                              </button>
                            )}
                            
                            {/* 发出邀请列表：只有POLISH_STATUS=1且EVALUATE_STATUS=0时才显示评价按钮 */}
                            {activeTab === 'submitted' && item.status === 1 && item.evaluate_status === 0 && (
                              <button
                                onClick={() => {
                                  setSelectedRecord(item);
                                  setShowStatusModal(true);
                                }}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1"
                              >
                                评价
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {currentData.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无数据</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 新增邀请模态框 */}
        {showAddModal && selectOptions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">新增文件润色邀请</h3>
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
                      导师
                    </label>
                    <select
                      value={formData.teacher_id}
                      onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">请选择导师</option>
                      {selectOptions.staff_list.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      学校类型
                    </label>
                    <select
                      value={formData.school_type}
                      onChange={(e) => setFormData({ ...formData, school_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">请选择学校类型</option>
                      {selectOptions.school_type.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PS类型
                    </label>
                    <select
                      value={formData.ps_type}
                      onChange={(e) => setFormData({ ...formData, ps_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">请选择PS类型</option>
                      {selectOptions.ps_type.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      字数
                    </label>
                    <input
                      type="number"
                      value={formData.words}
                      onChange={(e) => setFormData({ ...formData, words: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="请输入字数"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      专业
                    </label>
                    <input
                      type="text"
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="请输入专业"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    备注
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入备注"
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
                  onClick={handleAddPolish}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 状态处理模态框 */}
        {showStatusModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'received' ? '处理邀请' : '评价服务'}
                </h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {/* 被邀请列表的表单 */}
                  {activeTab === 'received' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          处理状态
                        </label>
                        <select
                          value={statusForm.status}
                          onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">请选择状态</option>
                          <option value="3">同意</option>
                          <option value="2">拒绝</option>
                        </select>
                      </div>
                      {statusForm.status === '2' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            拒绝原因
                          </label>
                          <textarea
                            value={statusForm.reject_reason}
                            onChange={(e) => setStatusForm({ ...statusForm, reject_reason: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="请输入拒绝原因（必填）"
                          />
                          <p className="text-xs text-red-600 mt-1">拒绝时必须填写原因</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* 发出邀请列表的表单 */}
                  {activeTab === 'submitted' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          评价状态
                        </label>
                        <select
                          value={statusForm.evaluate_status}
                          onChange={(e) => setStatusForm({ ...statusForm, evaluate_status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">请选择评价状态</option>
                          <option value="1">满意</option>
                          <option value="2">不满意</option>
                        </select>
                      </div>
                      {statusForm.evaluate_status === '2' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            不满意原因
                          </label>
                          <textarea
                            value={statusForm.unhappy}
                            onChange={(e) => setStatusForm({ ...statusForm, unhappy: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="请输入不满意原因（必填）"
                          />
                          <p className="text-xs text-red-600 mt-1">不满意时必须填写原因</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  {activeTab === 'received' ? '保存' : '提交评价'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
