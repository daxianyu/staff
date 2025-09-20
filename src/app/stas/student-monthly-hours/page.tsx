'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { getStudentsHoursOverview } from '@/services/auth';
import { ClockIcon, ExclamationTriangleIcon, AcademicCapIcon, CalendarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ExcelExporter, convertObjectsToSheetData } from '@/components/ExcelExporter';

interface StudentData {
  id: number;
  name: string;
  campus_name: string;
  hours: string;
}

interface CampusData {
  name: string;
  sum_hour: string;
  data: StudentData[];
}

interface StudentsHoursData {
  total: {
    sum_hour: string;
  };
  student_data_list: Record<string, CampusData>;
}

export default function StudentMonthlyHoursPage() {
  const { hasPermission } = useAuth();
  const [data, setData] = useState<StudentsHoursData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return Math.floor((new Date(year, month - 1, 1).getTime() - new Date(1970, 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  });
  const [selectedCampus, setSelectedCampus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_STUDENT_MONTHLY_HOURS) || hasPermission('finance') || hasPermission('core_admin');

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
  const loadData = async (month: number) => {
    try {
      setLoading(true);
      const response = await getStudentsHoursOverview(month);
      if (response.code === 200) {
        const responseData = response.data as StudentsHoursData;
        setData(responseData);
        if (responseData?.student_data_list) {
          const campusIds = Object.keys(responseData.student_data_list);
          if (campusIds.length > 0) {
            setSelectedCampus(campusIds[0]);
          }
        }
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
    loadData(selectedMonth);
  }, [selectedMonth]);

  // 生成月份选项
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = -12; i <= 0; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthValue = Math.floor((date.getTime() - new Date(1970, 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      
      options.push({
        value: monthValue,
        label: `${year}年${month}月`
      });
    }
    return options;
  };

  const currentCampusData = data && selectedCampus ? data.student_data_list[selectedCampus] : null;

  // 过滤学生数据
  const filteredStudents = currentCampusData?.data.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // 分页计算
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // 当搜索条件或校区改变时重置分页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCampus]);

  // 准备导出数据 - 每个校区一个sheet
  const prepareExportData = () => {
    if (!data) return [];

    // 为每个校区创建一个sheet
    const sheets = Object.entries(data.student_data_list).map(([campusId, campusData]) => {
      const students = campusData.data.map(student => ({
        学生姓名: student.name,
        校区: campusData.name,
        学习时数: student.hours
      }));

      const headers = [
        '学生姓名',
        '校区',
        '学习时数'
      ];

      return convertObjectsToSheetData(
        students,
        headers,
        campusData.name // 使用校区名称作为sheet名称
      );
    });

    return sheets;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">学生月度学习时数</h1>
          <p className="mt-2 text-sm text-gray-600">查看学生每月学习时间统计</p>
        </div>

        {/* 统计卡片 */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">总学习时数</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.total.sum_hour}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AcademicCapIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">校区数量</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Object.keys(data.student_data_list).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AcademicCapIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">当前校区学生</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {currentCampusData?.data.length || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">校区学习时数</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {currentCampusData?.sum_hour || '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* 月份选择 */}
            <div className="flex items-center gap-4">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">查询月份:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {generateMonthOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 校区选择 */}
            {data && Object.keys(data.student_data_list).length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">校区:</span>
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {Object.entries(data.student_data_list).map(([campusId, campusData]) => (
                    <option key={campusId} value={campusId}>
                      {campusData.name} ({campusData.data.length}人)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 搜索框和导出按钮 */}
            <div className="flex items-center gap-4">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="搜索学生姓名..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* 导出按钮 */}
              <ExcelExporter
                config={{
                  filename: '学生月度学习时数',
                  sheets: prepareExportData()
                }}
                disabled={loading || !data}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                导出Excel
              </ExcelExporter>
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !currentCampusData ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              暂无数据
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
                      学习时数
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500">
                        {searchTerm ? '没有找到匹配的学生' : '暂无学生数据'}
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student, index) => {
                      const globalIndex = startIndex + index;
                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {student.campus_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="font-semibold">{student.hours}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 分页组件 */}
        {currentCampusData && totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* 分页信息 */}
              <div className="text-sm text-gray-700">
                显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)} 条，共 {totalItems} 条记录
                {searchTerm && ` (搜索: "${searchTerm}")`}
              </div>

              {/* 分页控制 */}
              <div className="flex items-center gap-2">
                {/* 每页显示数量选择器 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">每页显示:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* 分页按钮 */}
                <div className="flex items-center gap-1">
                  {/* 上一页按钮 */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>

                  {/* 页码按钮 */}
                  {totalPages <= 7 ? (
                    // 如果总页数小于等于7，显示所有页码
                    Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                          currentPage === page
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))
                  ) : currentPage <= 4 ? (
                    // 当前页在前4页
                    <>
                      {Array.from({ length: 5 }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                            currentPage === page
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <span className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
                        ...
                      </span>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    </>
                  ) : currentPage >= totalPages - 3 ? (
                    // 当前页在后4页
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        1
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
                        ...
                      </span>
                      {Array.from({ length: 5 }, (_, i) => totalPages - 4 + i).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                            currentPage === page
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </>
                  ) : (
                    // 当前页在中间
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        1
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
                        ...
                      </span>
                      {Array.from({ length: 3 }, (_, i) => currentPage - 1 + i).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                            currentPage === page
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <span className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
                        ...
                      </span>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

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
