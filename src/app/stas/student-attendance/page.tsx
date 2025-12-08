'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { getStudentAttendance, getStudentAttendanceDetail } from '@/services/auth';
import { ClipboardDocumentListIcon, ExclamationTriangleIcon, CalendarIcon, UserIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ExcelExporter, convertObjectsToSheetData } from '@/components/ExcelExporter';

interface StudentAttendanceData {
  student_id: number;
  student_campus: string;
  mentor_name: string;
  mentor_id: number;
  student_name: string;
  lesson_count: number;
  percent: number;
  attendance: number;
  unattendance: number;
}

interface AttendanceDetail {
  student_id: number;
  lesson_id: number;
  authorized: number;
  authorized_text: string;
  start_time: string;
  end_time: string;
  subject_id: number;
  comments: string;
  topic_id: number;
  topic_name: string;
  class_id: number;
  class_name: string;
  teacher_name: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export default function StudentAttendancePage() {
  const { hasPermission } = useAuth();
  const [data, setData] = useState<{ rows: StudentAttendanceData[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return Math.floor((new Date(year, month - 1, 1).getTime() - new Date(1970, 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  });
  const [selectedStudent, setSelectedStudent] = useState<StudentAttendanceData | null>(null);
  const [attendanceDetails, setAttendanceDetails] = useState<{ rows: AttendanceDetail[]; total: number } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(1000);

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_STUDENT_ATTENDANCE);

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

  // 加载考勤数据
  const loadData = async (month: number) => {
    try {
      setLoading(true);
      const response = await getStudentAttendance(month) as ApiResponse<{ rows: StudentAttendanceData[]; total: number }>;
      if (response.code === 200) {
        setData(response.data);
      } else {
        console.error('加载数据失败:', response.message);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载学生详细考勤信息
  const loadStudentDetails = async (student: StudentAttendanceData) => {
    try {
      setDetailsLoading(true);
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const queryData = `${year}_${month}`;

      const response = await getStudentAttendanceDetail(student.student_id, queryData) as ApiResponse<{ rows: AttendanceDetail[]; total: number }>;
      if (response.code === 200) {
        setAttendanceDetails(response.data);
        setSelectedStudent(student);
      } else {
        console.error('加载详情失败:', response.message);
      }
    } catch (error) {
      console.error('加载详情失败:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedMonth);
  }, [selectedMonth]);

  // 生成月份选项
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();

    for (let i = -6; i <= 0; i++) {
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

  // 过滤数据
  const filteredData = data?.rows.filter(item =>
    item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.mentor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.student_campus.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // 分页计算
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // 搜索时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 准备导出数据
  const prepareExportData = () => {
    if (!data) return convertObjectsToSheetData([], [], '学生考勤统计');

    const exportData = data.rows.map(item => ({
      学生姓名: item.student_name,
      校区: item.student_campus,
      责任导师: item.mentor_name,
      请假次数: item.unattendance,
      缺席次数: item.attendance,
      排课节数: item.lesson_count,
      缺课占比: item.percent ? `${Math.round(item.percent * 100)}%` : '暂无'
    }));

    const headers = [
      '学生姓名',
      '校区',
      '责任导师',
      '请假次数',
      '缺席次数',
      '排课节数',
      '缺课占比'
    ];

    return convertObjectsToSheetData(
      exportData,
      headers,
      '学生考勤统计'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">学生考勤统计</h1>
          <p className="mt-2 text-sm text-gray-600">学生出勤情况和请假记录统计</p>
        </div>

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

            {/* 搜索框和导出按钮 */}
            <div className="flex items-center gap-4">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="搜索学生姓名、导师或校区..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 导出按钮 */}
              <ExcelExporter
                config={{
                  filename: '学生考勤统计',
                  sheets: [prepareExportData()]
                }}
                disabled={loading || !data}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                导出Excel
              </ExcelExporter>
            </div>

            <div className="text-sm text-gray-600">
              共 {totalItems} 条记录
            </div>
          </div>
        </div>

        {/* 考勤统计表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-blue-600" />
              学生考勤统计
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {paginatedData.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-gray-500">
                  {searchTerm ? '没有找到匹配的数据' : '暂无考勤数据'}
                </div>
              ) : (
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
                        责任导师
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        请假次数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        缺席次数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        排课(节)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        缺课占比
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((item, index) => (
                      <tr key={`${item.student_id}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.student_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.student_campus}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.mentor_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.unattendance}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.attendance}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.lesson_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.percent && item.percent < 0.8
                              ? 'bg-red-100 text-red-800'
                              : item.percent && item.percent < 0.9
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                            {item.percent ? `${Math.round(item.percent * 100)}%` : '暂无'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => loadStudentDetails(item)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* 分页组件 */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-700">
                显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)} 条，共 {totalItems} 条记录
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value={50}>50条/页</option>
                  <option value={100}>100条/页</option>
                  <option value={1000}>1000条/页</option>
                </select>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
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
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${currentPage === pageNum
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 7 && currentPage < totalPages - 3 && (
                    <span className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">...</span>
                  )}
                  {totalPages > 7 && currentPage < totalPages - 3 && (
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  )}
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

        {/* 考勤详情模态框 */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-green-600" />
                  {selectedStudent.student_name} 的考勤详情
                </h3>
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    setAttendanceDetails(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {detailsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : !attendanceDetails?.rows.length ? (
                  <div className="text-center text-sm text-gray-500 py-8">
                    该学生暂无考勤记录
                  </div>
                ) : (
                  <div className="space-y-4">
                    {attendanceDetails.rows.map((detail, index) => (
                      <div key={`${detail.lesson_id}-${index}`} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {detail.topic_name || detail.class_name}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${detail.authorized === 1
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                            }`}>
                            {detail.authorized_text}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>教师: {detail.teacher_name}</div>
                          <div>时间: {detail.start_time.split(' ')[0]} {detail.start_time.split(' ')[1]} - {detail.end_time.split(' ')[1]}</div>
                          {detail.comments && (
                            <div>备注: {detail.comments}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 汇总统计 */}
        {data && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">月度汇总</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-600">总学生数</div>
                <div className="text-2xl font-bold text-blue-900">{data.total}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-green-600">平均出勤率</div>
                <div className="text-2xl font-bold text-green-900">
                  {data.rows.length > 0
                    ? Math.round(data.rows.reduce((sum, item) => sum + (item.percent || 0), 0) / data.rows.length * 100)
                    : 0}%
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-sm font-medium text-yellow-600">总出勤次数</div>
                <div className="text-2xl font-bold text-yellow-900">
                  {data.rows.reduce((sum, item) => sum + item.attendance, 0)}
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-sm font-medium text-red-600">总缺席次数</div>
                <div className="text-2xl font-bold text-red-900">
                  {data.rows.reduce((sum, item) => sum + item.unattendance, 0)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
