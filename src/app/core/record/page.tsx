'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getOperationRecordList,
  getMentorChangeRecordList,
  type OperationRecord,
  type MentorChangeRecord,
  type OperationRecordListParams
} from '@/services/auth';
import {
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function CoreRecordPage() {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'operation' | 'mentor'>('operation');
  const [operationRecords, setOperationRecords] = useState<OperationRecord[]>([]);
  const [mentorRecords, setMentorRecords] = useState<MentorChangeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_CORE_RECORD);

  // 初始化日期范围
  useEffect(() => {
    const now = new Date();
    const endDay = now.toISOString().split('T')[0];
    const startDay = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setStartDate(startDay);
    setEndDate(endDay);
  }, []);

  // 加载操作记录
  const loadOperationRecords = async () => {
    if (!canView) return;

    setLoading(true);
    try {
      const params: OperationRecordListParams = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await getOperationRecordList(params);
      if (response.code === 200 && response.data) {
        setOperationRecords(response.data.rows);
      }
    } catch (error) {
      console.error('加载操作记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载导师变更记录
  const loadMentorRecords = async () => {
    if (!canView) return;

    setLoading(true);
    try {
      const response = await getMentorChangeRecordList();
      if (response.code === 200 && response.data) {
        setMentorRecords(response.data.rows);
      }
    } catch (error) {
      console.error('加载导师变更记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    if (activeTab === 'operation') {
      loadOperationRecords();
    } else {
      loadMentorRecords();
    }
  }, [activeTab, startDate, endDate, canView]);

  // 搜索过滤
  const filteredOperationRecords = operationRecords.filter(record =>
    record.operator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.operation_desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.operation_type_desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMentorRecords = mentorRecords.filter(record =>
    record.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.last_mentor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.now_mentor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看核心记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Core Record</h1>
          <p className="mt-1 text-sm text-gray-500">查看系统核心操作记录和导师变更记录</p>
        </div>

        {/* Tab 切换 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('operation')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'operation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <ClockIcon className="w-5 h-5 inline-block mr-2" />
                操作记录
              </button>
              <button
                onClick={() => setActiveTab('mentor')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'mentor'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <UserIcon className="w-5 h-5 inline-block mr-2" />
                导师变更记录
              </button>
            </nav>
          </div>
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
                  placeholder={activeTab === 'operation' ? "搜索操作员、描述..." : "搜索学生、导师名称..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* 日期范围选择（仅操作记录） */}
              {activeTab === 'operation' && (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'operation' ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作对象
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作类型
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作描述
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作前
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作后
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作人
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作时间
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOperationRecords.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {record.operator_name}
                                </div>
                                <div className="text-sm text-gray-500">ID: {record.operator_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {record.operation_type_desc}
                            </div>
                          </td>
                          <td className="px-6 py-4" style={{ width: '100px' }}>
                            <div className="text-sm text-gray-900">
                              {record.operation_desc}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 max-w-xs">
                              {record.operation_before}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 max-w-xs">
                              {record.operation_after}
                            </div>
                          </td>
                          <td>
                            <div className="text-sm text-gray-500 max-w-xs">
                              {record.operator}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {record.op_time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredOperationRecords.length === 0 && (
                    <div className="text-center py-12">
                      <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">暂无操作记录</h3>
                      <p className="mt-1 text-sm text-gray-500">在指定时间范围内没有找到操作记录</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          学生信息
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          原导师
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          新导师
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          变更时间
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMentorRecords.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {record.student_name}
                                </div>
                                <div className="text-sm text-gray-500">ID: {record.student_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{record.last_mentor_name}</div>
                            <div className="text-sm text-gray-500">ID: {record.last_mentor}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{record.now_mentor_name}</div>
                            <div className="text-sm text-gray-500">ID: {record.now_mentor}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.create_time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredMentorRecords.length === 0 && (
                    <div className="text-center py-12">
                      <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">暂无导师变更记录</h3>
                      <p className="mt-1 text-sm text-gray-500">没有找到导师变更记录</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* 统计信息 */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {activeTab === 'operation' ? filteredOperationRecords.length : filteredMentorRecords.length}
              </div>
              <div className="text-sm text-gray-500">
                {activeTab === 'operation' ? '操作记录总数' : '导师变更记录总数'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {searchTerm ? '已筛选' : '全部显示'}
              </div>
              <div className="text-sm text-gray-500">显示状态</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {activeTab === 'operation' ? '7天' : '全部'}
              </div>
              <div className="text-sm text-gray-500">
                {activeTab === 'operation' ? '默认时间范围' : '记录范围'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
