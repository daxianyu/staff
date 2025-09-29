'use client';

import { useEffect, useState } from 'react';
import {
  getClassChangeSelect,
  getClassChangeList,
  addClassChange,
  updateMentorClassChangeStatus,
  type ClassChangeSelectData,
  type MentorClassChangeRecord,
  type AddClassChangeParams,
} from '@/services/modules/classChange';
import {
  CalendarIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon,
  UserIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export default function ClassChangePage() {
  const canView = true;

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MentorClassChangeRecord[]>([]);
  const [selectData, setSelectData] = useState<ClassChangeSelectData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddClassChangeParams>({
    teacher_id: 0,
    teacher_name: '',
    student_id: 0,
    student_name: '',
    change_desc: '',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    action: () => {},
  });

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [selectResponse, listResponse] = await Promise.all([
        getClassChangeSelect(),
        getClassChangeList(),
      ]);
      
      if (selectResponse.code === 200) {
        setSelectData(selectResponse.data);
      }
      
      if (listResponse.code === 0) {
        setRecords(listResponse.data.rows || []);
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

  // 添加调课申请
  const handleAddClassChange = async () => {
    if (!addForm.teacher_id || !addForm.student_id || !addForm.change_desc.trim()) {
      alert('请填写完整信息');
      return;
    }

    setActionLoading(true);
    try {
      const response = await addClassChange(addForm);
      if (response.code === 200) {
        alert('申请提交成功');
        setShowAddModal(false);
        setAddForm({
          teacher_id: 0,
          teacher_name: '',
          student_id: 0,
          student_name: '',
          change_desc: '',
        });
        loadData();
      } else {
        alert('申请提交失败: ' + response.message);
      }
    } catch (error) {
      console.error('添加调课申请失败:', error);
      alert('申请提交失败');
    } finally {
      setActionLoading(false);
    }
  };

  // 撤销申请
  const handleRevoke = (recordId: number) => {
    setConfirmAction({
      show: true,
      title: '确认撤销',
      message: '确定要撤销此调课申请吗？',
      action: async () => {
        setActionLoading(true);
        try {
          const response = await updateMentorClassChangeStatus({
            record_id: recordId,
            status: -2, // 撤销状态
            reject_reason: '申请人撤销',
          });
          
          if (response.code === 200) {
            alert('撤销成功');
            loadData();
          } else {
            alert('撤销失败: ' + response.message);
          }
        } catch (error) {
          console.error('撤销失败:', error);
          alert('撤销失败');
        } finally {
          setActionLoading(false);
          setConfirmAction({ show: false, title: '', message: '', action: () => {} });
        }
      },
    });
  };

  // 过滤记录
  const filteredRecords = records.filter(record => {
    return record.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           record.apply_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           record.desc.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 权限检查
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
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Class Change</h1>
                <p className="text-gray-600">调课申请管理</p>
              </div>
            </div>
            
            {/* 新增按钮 */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              新增申请
            </button>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索学生、申请人或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              共 {filteredRecords.length} 条记录
            </div>
          </div>
        </div>

        {/* 调课申请列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请人
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学生名字
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请描述
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      审批人
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      拒绝/撤销理由
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {record.apply_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.student_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {record.desc}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {record.apply_time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status_num === 0 ? 'bg-yellow-100 text-yellow-800' :
                          record.status_num === 1 ? 'bg-green-100 text-green-800' :
                          record.status_num === 2 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectData?.status_dict[record.status_num.toString()] || record.status || '未知'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.operator_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {record.reject_reason || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.status_num === 0 && (
                          <button
                            onClick={() => handleRevoke(record.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            撤销
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">暂无调课申请记录</p>
            </div>
          )}
        </div>

        {/* 新增调课申请模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">新增调课申请</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* 选择学生 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    请选择学生
                  </label>
                  <select
                    value={addForm.student_id}
                    onChange={(e) => {
                      const studentId = Number(e.target.value);
                      const studentName = selectData?.students[studentId.toString()] || '';
                      setAddForm({
                        ...addForm,
                        student_id: studentId,
                        student_name: studentName,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>请选择学生</option>
                    {selectData && Object.entries(selectData.students).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* 选择审批组长 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    审批的组长
                  </label>
                  <select
                    value={addForm.teacher_id}
                    onChange={(e) => {
                      const teacherId = Number(e.target.value);
                      const teacherName = selectData?.op_dict[teacherId.toString()] || '';
                      setAddForm({
                        ...addForm,
                        teacher_id: teacherId,
                        teacher_name: teacherName,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>请选择组长</option>
                    {selectData && Object.entries(selectData.op_dict).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* 调课描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    调课描述
                  </label>
                  <textarea
                    value={addForm.change_desc}
                    onChange={(e) => setAddForm({ ...addForm, change_desc: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请描述调课原因..."
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleAddClassChange}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? '提交中...' : '提交申请'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 确认操作模态框 */}
        {confirmAction.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">{confirmAction.title}</h3>
                </div>
                <p className="text-gray-600 mb-6">{confirmAction.message}</p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setConfirmAction({ show: false, title: '', message: '', action: () => {} })}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmAction.action}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? '处理中...' : '确认'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
