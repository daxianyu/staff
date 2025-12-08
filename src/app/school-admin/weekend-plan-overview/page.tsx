'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  HomeIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import {
  getStudentWeekendTimeTable,
  type LiveRecord,
  type DinnerRecord,
  type WeekendTimeTableResponse,
} from '@/services/auth';

export default function WeekendPlanOverviewPage() {
  const { hasPermission } = useAuth();
  const [liveRecords, setLiveRecords] = useState<LiveRecord[]>([]);
  const [dinnerRecords, setDinnerRecords] = useState<DinnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'dinner'>('live');
  const [searchTerm, setSearchTerm] = useState('');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_WEEKEND_PLAN);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await getStudentWeekendTimeTable();
      if (response.code === 200 && response.data) {
        setLiveRecords(response.data.live_result.rows);
        setDinnerRecords(response.data.dinner_result.rows);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView]);

  // 获取当前标签页的数据
  const getCurrentData = () => {
    return activeTab === 'live' ? liveRecords : dinnerRecords;
  };

  // 过滤数据
  const getFilteredData = () => {
    const data = getCurrentData();
    if (!searchTerm) return data;
    
    return data.filter(record => {
      const searchFields = [
        record.student_name,
        record.campus_name,
        record.mentor_name,
        activeTab === 'live' ? (record as LiveRecord).live_date : (record as DinnerRecord).dine_date,
      ];
      
      if (activeTab === 'dinner') {
        const dinnerRecord = record as DinnerRecord;
        searchFields.push(dinnerRecord.time_type, dinnerRecord.status_name);
      }
      
      return searchFields.some(field => 
        field?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  // 分页计算
  const filteredData = getFilteredData();
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 切换标签页
  const handleTabChange = (tab: 'live' | 'dinner') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm('');
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有访问周末计划统计页面的权限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">周末计划统计</h1>
          <p className="mt-2 text-sm text-gray-600">查看学生周末住宿和就餐统计信息</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HomeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">住宿记录总数</dt>
                  <dd className="text-lg font-medium text-gray-900">{liveRecords.length}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">就餐记录总数</dt>
                  <dd className="text-lg font-medium text-gray-900">{dinnerRecords.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => handleTabChange('live')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'live'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <HomeIcon className="h-4 w-4" />
                  住宿记录 ({liveRecords.length})
                </div>
              </button>
              <button
                onClick={() => handleTabChange('dinner')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'dinner'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  就餐记录 ({dinnerRecords.length})
                </div>
              </button>
            </nav>
          </div>

          {/* 搜索栏 */}
          <div className="p-6">
            <div className="relative max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`搜索${activeTab === 'live' ? '住宿' : '就餐'}记录...`}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        学生信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        校区
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        导师
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {activeTab === 'live' ? '住宿日期' : '就餐日期'}
                      </th>
                      {activeTab === 'dinner' && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            餐次类型
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            价格
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            支付状态
                          </th>
                        </>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        创建时间
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((record, index) => (
                      <tr key={`${activeTab}-${record.record_id}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{record.student_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.campus_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.mentor_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {activeTab === 'live' 
                                  ? (record as LiveRecord).live_date_str 
                                  : (record as DinnerRecord).dine_date_str
                                }
                              </div>
                            </div>
                          </div>
                        </td>
                        {activeTab === 'dinner' && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {(record as DinnerRecord).time_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ¥{(record as DinnerRecord).price}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                (record as DinnerRecord).status_name === '已支付'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {(record as DinnerRecord).status_name}
                              </span>
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.create_time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页组件 */}
              {totalPages > 1 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)} 条，共 {totalItems} 条记录
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700">每页显示:</label>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          上一页
                        </button>
                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 7) {
                            pageNum = i + 1;
                          } else if (currentPage <= 4) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 3) {
                            pageNum = totalPages - 6 + i;
                          } else {
                            pageNum = currentPage - 3 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          下一页
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
