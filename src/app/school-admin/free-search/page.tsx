'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  freeSearch,
  type FreeSearchRecord,
  type FreeSearchRequest,
} from '@/services/auth';

export default function FreeSearchPage() {
  const { hasPermission } = useAuth();
  const [searchResults, setSearchResults] = useState<FreeSearchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // 搜索表单数据
  const [searchForm, setSearchForm] = useState({
    user_type: 0, // 0: 教师, 1: 学生
    query_start: '',
    query_end: '',
  });

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_FREE_SEARCH);

  // 处理搜索
  const handleSearch = async () => {
    if (!searchForm.query_start || !searchForm.query_end) {
      alert('请选择查询时间范围');
      return;
    }

    if (new Date(searchForm.query_start) >= new Date(searchForm.query_end)) {
      alert('开始时间必须早于结束时间');
      return;
    }

    setLoading(true);
    try {
      const response = await freeSearch(searchForm as FreeSearchRequest);
      if (response.code === 200 && response.data) {
        setSearchResults(response.data.rows);
        setHasSearched(true);
        setCurrentPage(1);
      } else {
        alert(response.message || '查询失败');
      }
    } catch (error) {
      console.error('查询空闲时间失败:', error);
      alert('查询失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置搜索
  const handleReset = () => {
    setSearchForm({
      user_type: 0,
      query_start: '',
      query_end: '',
    });
    setSearchResults([]);
    setHasSearched(false);
    setCurrentPage(1);
  };

  // 分页计算
  const totalItems = searchResults.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedResults = searchResults.slice(startIndex, endIndex);

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有访问空闲搜索页面的权限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">空闲时间查询</h1>
          <p className="mt-2 text-sm text-gray-600">查询指定时间段内空闲的教师或学生</p>
        </div>

        {/* 搜索表单 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">查询类型</label>
              <select
                value={searchForm.user_type}
                onChange={(e) => setSearchForm(prev => ({ ...prev, user_type: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>教师</option>
                <option value={1}>学生</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
              <input
                type="datetime-local"
                value={searchForm.query_start}
                onChange={(e) => setSearchForm(prev => ({ ...prev, query_start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
              <input
                type="datetime-local"
                value={searchForm.query_end}
                onChange={(e) => setSearchForm(prev => ({ ...prev, query_end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                {loading ? '查询中...' : '查询'}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                重置
              </button>
            </div>
          </div>
        </div>

        {/* 搜索结果 */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  搜索结果 ({searchResults.length} 人)
                </h3>
                {searchForm.query_start && searchForm.query_end && (
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {new Date(searchForm.query_start).toLocaleString()} - {new Date(searchForm.query_end).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  {searchForm.user_type === 0 ? (
                    <UserIcon className="h-12 w-12" />
                  ) : (
                    <AcademicCapIcon className="h-12 w-12" />
                  )}
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">暂无空闲人员</h3>
                <p className="mt-1 text-sm text-gray-500">
                  在指定时间段内没有找到空闲的{searchForm.user_type === 0 ? '教师' : '学生'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          序号
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          类型
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          姓名
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedResults.map((result, index) => (
                        <tr key={`${result.user_type}-${result.user_name}-${index}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {result.user_type === '教师' ? (
                                <UserIcon className="h-5 w-5 text-blue-500 mr-2" />
                              ) : (
                                <AcademicCapIcon className="h-5 w-5 text-green-500 mr-2" />
                              )}
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                result.user_type === '教师' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {result.user_type}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {result.user_name}
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
        )}
      </div>
    </div>
  );
}
