'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  getClassHourPromotionRecordList,
  ClassHourPromotionRecord,
} from '@/services/auth';

export default function FeePromotionPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_FEE_PROMOTION);

  // 状态管理
  const [records, setRecords] = useState<ClassHourPromotionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [queryDate, setQueryDate] = useState<string>('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看课时费晋升管理</p>
        </div>
      </div>
    );
  }

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const params: { query_date?: string } = {};
      if (queryDate) {
        params.query_date = queryDate;
      }
      
      const result = await getClassHourPromotionRecordList(params);
      if (result.code === 200 && result.data) {
        // 确保 data 是数组
        const dataArray = Array.isArray(result.data) ? result.data : [];
        setRecords(dataArray);
      } else {
        console.error('获取课时费晋升记录失败:', result.message);
        setRecords([]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 过滤记录（按名字搜索）
  const filteredRecords = Array.isArray(records) 
    ? records.filter(record =>
        record.staff_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // 分页计算
  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // 搜索时重置到第一页
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 处理日期变化
  const handleDateChange = (value: string) => {
    setQueryDate(value);
    setCurrentPage(1);
  };

  // 处理查询
  const handleQuery = () => {
    loadData();
    setCurrentPage(1);
  };

  // 处理重置
  const handleReset = () => {
    setQueryDate('');
    setSearchTerm('');
    setCurrentPage(1);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">课时费晋升Overview</h1>
          <p className="mt-2 text-sm text-gray-600">查看导师课时费晋升记录</p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* 名字搜索 */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索姓名..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* 日期选择 */}
              <div className="flex-1 max-w-md">
                <input
                  type="date"
                  value={queryDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleQuery}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                查询
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                重置
              </button>
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">所在校区</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前职级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">基础职级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">授课时长(小时)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">是否达到晋升</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">待晋升后职级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原因</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRecords.map((record, index) => (
                    <tr key={`${record.staff_id}-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.staff_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.campus_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.current_level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.base_position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.cumulative_hours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.flag === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.flag_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.next_level}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {record.fall_info || '-'}
                      </td>
                    </tr>
                  ))}
                  {paginatedRecords.length === 0 && filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 分页组件 */}
        {filteredRecords.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* 分页信息 */}
              <div className="text-sm text-gray-600">
                显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)} 项，共 {totalItems} 项
              </div>
              
              {/* 分页控件 */}
              <div className="flex items-center gap-4">
                {/* 每页显示数量选择 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">每页显示</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                
                {/* 分页按钮 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  
                  {/* 页码显示 */}
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    
                    if (totalPages > 7 && i === 0 && currentPage > 4) {
                      return (
                        <div key="start-ellipsis" className="flex items-center gap-1">
                          <button
                            onClick={() => handlePageChange(1)}
                            className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            1
                          </button>
                          <span className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">...</span>
                        </div>
                      );
                    }
                    
                    if (totalPages > 7 && i === 6 && currentPage < totalPages - 3) {
                      return (
                        <div key="end-ellipsis" className="flex items-center gap-1">
                          <span className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">...</span>
                          <button
                            onClick={() => handlePageChange(totalPages)}
                            className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            {totalPages}
                          </button>
                        </div>
                      );
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
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
                    onClick={() => handlePageChange(currentPage + 1)}
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
      </div>
    </div>
  );
}
