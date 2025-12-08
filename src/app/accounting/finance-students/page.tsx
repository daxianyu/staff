'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getFinanceStudents,
  FinanceStudentsParams,
  FinanceStudentData,
  getAllCampus,
  type Campus
} from '@/services/auth';
import { 
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { ExcelExporter } from '@/components/ExcelExporter';

export default function FinanceStudentsPage() {
  const { hasPermission } = useAuth();
  const [studentList, setStudentList] = useState<FinanceStudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCampus, setSelectedCampus] = useState<number>(-1);
  const [campusList, setCampusList] = useState<Campus[]>([]);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  // 权限检查
  const canView = hasPermission(PERMISSIONS.FINANCE) || hasPermission(PERMISSIONS.SALES_PERSON);

  // 如果没有权限，显示无权限页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">权限不足</h1>
          <p className="mt-2 text-gray-600">您没有查看财务学生数据的权限</p>
        </div>
      </div>
    );
  }

  // 加载校区列表
  const loadCampusList = async () => {
    try {
      const result = await getAllCampus();
      if (result.status === 200 && result.data) {
        setCampusList(result.data || []);
      }
    } catch (error) {
      console.error('加载校区列表失败:', error);
    }
  };

  // 加载财务学生数据
  const loadStudentData = async () => {
    setLoading(true);
    try {
      const params: FinanceStudentsParams = {};
      if (startDate) params.start_day = startDate;
      if (endDate) params.end_day = endDate;
      if (selectedCampus !== -1) params.campus = selectedCampus;

      const result = await getFinanceStudents(params);
      if (result.code === 200 && result.data) {
        const rows = (result.data as any)?.rows ?? [];
        setStudentList(rows as FinanceStudentData[]);
        setTotalItems((result.data as any)?.total || 0);
      } else {
        console.error('获取财务学生数据失败:', result.message);
      }
    } catch (error) {
      console.error('加载财务学生数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampusList();
    loadStudentData();
  }, []);

  // 搜索过滤
  const filteredStudents = studentList.filter(student =>
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.campus_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分页计算
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // 处理查询按钮点击
  const handleSearch = () => {
    loadStudentData();
  };

  // 处理重置按钮点击
  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCampus(-1);
    setSearchTerm('');
    // 重新加载数据
    setTimeout(() => {
      loadStudentData();
    }, 100);
  };

  // 导出配置
  const exportHeaders = ['Student ID', 'Student Name', 'Campus Name', 'Enrolment Date', 'Graduation Date', 'Current Status', 'Year Fee', 'Class Hours', 'Attendance Hours', 'Total Hours'];
  const exportRows = filteredStudents.map((student) => [
    student.student_id,
    student.student_name,
    student.campus_name,
    student.enrolment_date,
    student.graduation_date,
    student.stop_reason,
    student.year_fee,
    student.class_hours,
    student.attendance_hours,
    student.total_hours,
  ]);

  // 分页组件
  const Pagination = () => {
    const maxVisiblePages = 7;
    const pages = [];
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600">
            显示第 {startIndex + 1} - {Math.min(endIndex, filteredStudents.length)} 条，共 {filteredStudents.length} 条记录
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={50}>50条/页</option>
              <option value={100}>100条/页</option>
            </select>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              
              {pages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && handlePageChange(page)}
                  disabled={page === '...'}
                  className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                    page === currentPage
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : page === '...'
                      ? 'bg-white border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">财务学生数据</h1>
          <p className="mt-1 text-sm text-gray-600">查看学生的财务相关数据统计</p>
        </div>

        {/* 搜索和筛选栏 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          {/* 头部标题栏 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MagnifyingGlassIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">数据筛选</h3>
                  <p className="text-sm text-gray-600">根据条件筛选财务学生数据</p>
                </div>
              </div>
              <ExcelExporter
                config={{
                  filename: '财务学生数据',
                  sheets: [
                    {
                      name: '财务学生',
                      headers: exportHeaders,
                      data: exportRows,
                    },
                  ],
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span className="font-medium">导出Excel</span>
              </ExcelExporter>
            </div>
          </div>

          {/* 筛选表单 */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 搜索框 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  搜索学生
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="输入学生姓名或校区"
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* 开始日期 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  开始日期
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* 结束日期 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  结束日期
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* 校区选择 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  选择校区
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <select
                    value={selectedCampus}
                    onChange={(e) => setSelectedCampus(Number(e.target.value))}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                  >
                    <option value={-1}>全部校区</option>
                    {campusList.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                <span>重置</span>
              </button>
              <button
                onClick={handleSearch}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>查询</span>
              </button>
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campus Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrolment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Graduation Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.student_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {student.campus_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {student.enrolment_date}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {student.graduation_date}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {student.stop_reason}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ¥{student.year_fee}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">{student.class_hours}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">{student.attendance_hours}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">{student.total_hours}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 数据统计 */}
          {!loading && filteredStudents.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                共找到 <span className="font-medium text-gray-900">{filteredStudents.length}</span> 条记录
              </div>
            </div>
          )}
        </div>

        {/* 分页组件 */}
        {!loading && filteredStudents.length > 0 && <Pagination />}
      </div>
    </div>
  );
}
