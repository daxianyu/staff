'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import SearchableSelect from '@/components/SearchableSelect';
import { 
  getExitPermitList,
  type ExitPermitRecord
} from '@/services/auth';
import { 
  MapPinIcon, 
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function CoreExitPermitPage() {
  const { hasPermission } = useAuth();
  const [records, setRecords] = useState<ExitPermitRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_CORE_EXIT_PERMIT);

  // 加载外出申请记录
  const loadRecords = async () => {
    if (!canView) return;
    
    setLoading(true);
    try {
      const response = await getExitPermitList();
      if (response.code === 200 && response.data) {
        setRecords(response.data.rows);
      }
    } catch (error) {
      console.error('加载外出申请记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    loadRecords();
  }, [canView]);

  const studentOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of records) {
      const id = String(r.student_id ?? '');
      const name = String(r.student_name ?? '').trim();
      if (!id || !name) continue;
      if (!seen.has(id)) seen.set(id, name);
    }
    const options = Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));

    return [{ id: '', name: '全部学生' }, ...options];
  }, [records]);

  // 搜索过滤
  const filteredRecords = records.filter(record => {
    if (selectedStudentId && String(record.student_id) !== selectedStudentId) return false;

    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;

    return (
      String(record.student_name ?? '').toLowerCase().includes(keyword) ||
      String(record.staff_name ?? '').toLowerCase().includes(keyword) ||
      String(record.note ?? '').toLowerCase().includes(keyword) ||
      String(record.status_name ?? '').toLowerCase().includes(keyword)
    );
  });

  // 获取状态颜色
  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-800'; // 待审核
      case 1: return 'bg-green-100 text-green-800';   // 已通过
      case 2: return 'bg-red-100 text-red-800';       // 已拒绝
      case 3: return 'bg-blue-100 text-blue-800';     // 已完成
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取分发状态颜色
  const getDistributeStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-orange-100 text-orange-800'; // 未分发
      case 1: return 'bg-green-100 text-green-800';   // 已分发
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDistributeStatusText = (status: number) => {
    switch (status) {
      case 0: return '未分发';
      case 1: return '已分发';
      default: return '未知';
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看外出申请管理</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Exit Permit Management</h1>
          <p className="mt-1 text-sm text-gray-500">查看和管理学生外出申请记录</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* 学生姓名搜索 */}
              <div className="w-full sm:w-[260px]">
                <SearchableSelect<string>
                  options={studentOptions}
                  value={selectedStudentId}
                  onValueChange={(v) => setSelectedStudentId(String(v))}
                  placeholder="选择学生"
                  searchPlaceholder="搜索学生姓名..."
                  className="w-full"
                  disabled={loading}
                />
              </div>

              {/* 搜索框 */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="搜索学生、员工、备注、状态..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* 刷新按钮 */}
            <button
              onClick={loadRecords}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              刷新数据
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
                      学生信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      导师
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      外出时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      备注
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分发状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请时间
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.record_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{record.student_name}</div>
                            <div className="text-sm text-gray-500">ID: {record.student_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{record.staff_name}</div>
                          <div className="text-sm text-gray-500">ID: {record.staff_id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                            开始: {record.start_time}
                          </div>
                          <div className="flex items-center mt-1">
                            <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                            结束: {record.end_time}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {record.note ? (
                            <div className="truncate" title={record.note}>
                              {record.note}
                            </div>
                          ) : (
                            <span className="text-gray-400">无备注</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getDistributeStatusColor(record.distribute_status)}`}>
                          {getDistributeStatusText(record.distribute_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.create_time}</div>
                        {record.update_time !== record.create_time && (
                          <div className="text-xs text-gray-500">更新: {record.update_time}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">暂无外出申请记录</h3>
                  <p className="mt-1 text-sm text-gray-500">没有找到符合条件的外出申请记录</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 统计信息 */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">申请统计</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredRecords.length}</div>
              <div className="text-sm text-gray-500">申请总数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredRecords.filter(r => r.status === 0).length}
              </div>
              <div className="text-sm text-gray-500">待审核</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredRecords.filter(r => r.status === 1).length}
              </div>
              <div className="text-sm text-gray-500">已通过</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredRecords.filter(r => r.distribute_status === 0).length}
              </div>
              <div className="text-sm text-gray-500">未分发</div>
            </div>
          </div>
        </div>

        {/* 状态说明 */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">状态说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">申请状态</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 mr-2">
                    待审核
                  </span>
                  <span className="text-sm text-gray-600">申请已提交，等待审核</span>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mr-2">
                    已通过
                  </span>
                  <span className="text-sm text-gray-600">申请已通过审核</span>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 mr-2">
                    已拒绝
                  </span>
                  <span className="text-sm text-gray-600">申请被拒绝</span>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mr-2">
                    已完成
                  </span>
                  <span className="text-sm text-gray-600">外出申请已完成</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">分发状态</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 mr-2">
                    未分发
                  </span>
                  <span className="text-sm text-gray-600">通知尚未分发给相关人员</span>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mr-2">
                    已分发
                  </span>
                  <span className="text-sm text-gray-600">通知已分发给相关人员</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 数据提示 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <MapPinIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">数据说明</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>• 数据显示最近10天内的外出申请记录</p>
                <p>• 可以通过搜索框快速查找特定的申请记录</p>
                <p>• 申请状态和分发状态会实时更新</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
