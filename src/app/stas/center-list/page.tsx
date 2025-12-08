'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { getCenterList } from '@/services/auth';
import { BuildingOfficeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface CenterItem {
  center_id: number;
  center_level: string[];
  center_name: string[];
  status: string;
  time: string;
}

export default function CenterListPage() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<CenterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_CENTER_LIST) || hasPermission('finance');

  // 如果没有权限，显示无权限页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有访问此页面的权限</p>
        </div>
      </div>
    );
  }

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getCenterList();
      if (response.code === 200) {
        setItems(response.data as CenterItem[] || []);
      } else {
        console.error('加载数据失败:', response.message);
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

  // 过滤数据
  const filteredItems = items.filter(item =>
    item.center_id.toString().includes(searchTerm) ||
    item.center_name.some(name => name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分页计算
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // 当搜索条件改变时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">考试中心列表</h1>
          <p className="mt-2 text-sm text-gray-600">管理和查看所有考试中心信息</p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="搜索中心ID、名称或状态..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                共 {filteredItems.length} 个中心
              </span>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Center No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      考试级别
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Center Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      上次更新时间
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                        {searchTerm ? '没有找到匹配的数据' : '暂无数据'}
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item, index) => (
                      <tr key={`${item.center_id}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.center_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-wrap gap-1">
                            {item.center_level.map((level, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {level}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="space-y-1">
                            {item.center_name.map((name, idx) => (
                              <div key={idx}>{name}</div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === '有效'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.time}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 分页组件 */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-600">
                显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)} 条，共 {totalItems} 条记录
              </div>
              
              <div className="flex items-center gap-4">
                {/* 每页显示数量选择器 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">每页显示:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* 分页按钮组 */}
                <div className="flex items-center gap-2">
                  {/* 上一页按钮 */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>

                  {/* 页码按钮 */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages = [];
                      const maxVisiblePages = 7;
                    
                      if (totalPages <= maxVisiblePages) {
                        // 显示所有页码
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handlePageChange(i)}
                              className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                                currentPage === i
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                      } else {
                        // 智能显示页码
                        const startPage = Math.max(1, currentPage - 3);
                        const endPage = Math.min(totalPages, currentPage + 3);
                        
                        // 第一页
                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => handlePageChange(1)}
                              className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              1
                            </button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span key="ellipsis1" className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
                                ...
                              </span>
                            );
                          }
                        }
                        
                        // 中间页码
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handlePageChange(i)}
                              className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                                currentPage === i
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                        
                        // 最后一页
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="ellipsis2" className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
                                ...
                              </span>
                            );
                          }
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => handlePageChange(totalPages)}
                              className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              {totalPages}
                            </button>
                          );
                        }
                      }
                      
                      return pages;
                    })()}
                  </div>

                  {/* 下一页按钮 */}
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
