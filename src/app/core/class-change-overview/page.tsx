'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getClassChangeRecordList,
  updateClassChangeStatus,
  addClassChangeRecord,
  type ClassChangeRecord,
  type ClassChangeRecordListParams,
  type UpdateClassChangeStatusParams,
  type AddClassChangeRecordParams
} from '@/services/auth';
import {
  CalendarIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function ClassChangeOverviewPage() {
  const { hasPermission } = useAuth();
  const [records, setRecords] = useState<ClassChangeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ClassChangeRecord | null>(null);
  const [statusAction, setStatusAction] = useState<'approve' | 'reject' | 'withdraw'>('approve');

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_CLASS_CHANGE_OVERVIEW);

  // 表单数据
  const [formData, setFormData] = useState({
    student_id: '',
    student_name: '',
    teacher_id: '',
    teacher_name: '',
    change_desc: ''
  });

  const [statusFormData, setStatusFormData] = useState({
    reject_reason: ''
  });

  // 初始化日期范围
  useEffect(() => {
    const now = new Date();
    const endDay = now.toISOString().split('T')[0];
    const startDay = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setStartDate(startDay);
    setEndDate(endDay);
  }, []);

  // 加载调课记录
  const loadRecords = async () => {
    if (!canView) return;

    setLoading(true);
    try {
      const params: ClassChangeRecordListParams = {};
      if (startDate) params.start_day = startDate;
      if (endDate) params.end_day = endDate;

      const response = await getClassChangeRecordList(params);
      if (response.code === 200 && response.data) {
        setRecords(response.data.rows);
      }
    } catch (error) {
      console.error('加载调课记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    loadRecords();
  }, [startDate, endDate, canView]);

  // 搜索过滤
  const filteredRecords = records.filter(record =>
    record.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.apply_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.operator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 添加调课记录
  const handleAddRecord = async () => {
    try {
      const params: AddClassChangeRecordParams = {
        student_id: parseInt(formData.student_id),
        student_name: formData.student_name,
        teacher_id: parseInt(formData.teacher_id),
        teacher_name: formData.teacher_name,
        change_desc: formData.change_desc
      };

      const response = await addClassChangeRecord(params);
      if (response.code === 200) {
        setShowAddModal(false);
        setFormData({
          student_id: '',
          student_name: '',
          teacher_id: '',
          teacher_name: '',
          change_desc: ''
        });
        loadRecords();
      }
    } catch (error) {
      console.error('添加调课记录失败:', error);
    }
  };

  // 更新记录状态
  const handleUpdateStatus = async () => {
    if (!selectedRecord) return;

    try {
      const params: UpdateClassChangeStatusParams = {
        record_id: selectedRecord.id,
        status: statusAction === 'approve' ? 1 : statusAction === 'reject' ? 2 : -2,
        reject_reason: statusAction !== 'approve' ? statusFormData.reject_reason : undefined
      };

      const response = await updateClassChangeStatus(params);
      if (response.code === 200) {
        setShowStatusModal(false);
        setSelectedRecord(null);
        setStatusFormData({ reject_reason: '' });
        loadRecords();
      }
    } catch (error) {
      console.error('更新记录状态失败:', error);
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case '待处理': return 'bg-yellow-100 text-yellow-800';
      case '已通过': return 'bg-green-100 text-green-800';
      case '已拒绝': return 'bg-red-100 text-red-800';
      case '已撤回': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看调课概览</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Class Change Overview</h1>
          <p className="mt-1 text-sm text-gray-500">查看和管理调课申请记录</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="搜索学生、申请人、操作员、描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* 日期范围选择 */}
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-500">至</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 添加按钮 */}
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              添加调课记录
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学生
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作员
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请描述
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.apply_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.student_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{record.operator_name || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-normal break-words" style={{ width: '300px', minWidth: '300px', maxWidth: '300px' }}>
                        <div className="text-sm text-gray-900">
                          {record.desc}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words" style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                        {record.reject_reason && (
                          <div className="text-xs text-red-600 mt-1">
                            {record.reject_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>申请: {record.apply_time}</div>
                        <div>更新: {record.update_time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {record.status_num === 0 && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedRecord(record);
                                setStatusAction('approve');
                                setShowStatusModal(true);
                              }}
                              className="text-green-600 hover:text-green-900 text-sm border border-gray-300 rounded-md px-2 py-1"
                              title="通过"
                            >
                              通过
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRecord(record);
                                setStatusAction('reject');
                                setShowStatusModal(true);
                              }}
                              className="text-red-600 hover:text-red-900 text-sm border border-gray-300 rounded-md px-2 py-1"
                              title="拒绝"
                            >
                              拒绝
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">暂无调课记录</h3>
                  <p className="mt-1 text-sm text-gray-500">在指定时间范围内没有找到调课记录</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 统计信息 */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredRecords.length}</div>
              <div className="text-sm text-gray-500">记录总数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredRecords.filter(r => r.status_num === 0).length}
              </div>
              <div className="text-sm text-gray-500">待处理</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredRecords.filter(r => r.status_num === 1).length}
              </div>
              <div className="text-sm text-gray-500">已通过</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredRecords.filter(r => r.status_num === 2 || r.status_num === -2).length}
              </div>
              <div className="text-sm text-gray-500">已拒绝/撤回</div>
            </div>
          </div>
        </div>
      </div>

      {/* 添加记录模态框 */}
      {
        showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">添加调课记录</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">学生ID</label>
                  <input
                    type="number"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">学生姓名</label>
                  <input
                    type="text"
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">老师ID</label>
                  <input
                    type="number"
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">老师姓名</label>
                  <input
                    type="text"
                    value={formData.teacher_name}
                    onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">调课描述</label>
                  <textarea
                    value={formData.change_desc}
                    onChange={(e) => setFormData({ ...formData, change_desc: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleAddRecord}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* 状态更新模态框 */}
      {
        showStatusModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {statusAction === 'approve' ? '通过申请' : '拒绝申请'}
                </h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  申请人: {selectedRecord.apply_name} | 学生: {selectedRecord.student_name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  描述: {selectedRecord.desc}
                </p>
              </div>
              {statusAction !== 'approve' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">拒绝原因</label>
                  <textarea
                    value={statusFormData.reject_reason}
                    onChange={(e) => setStatusFormData({ reject_reason: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入拒绝原因..."
                  />
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateStatus}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${statusAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  确认{statusAction === 'approve' ? '通过' : '拒绝'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
