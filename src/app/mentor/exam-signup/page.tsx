'use client';

import { useEffect, useState } from 'react';
import {
  getExamList,
  type ExamListItem,
} from '@/services/auth';
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TagIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export default function ExamSignupPage() {
  const canView = true;

  // 考试期间和类型常量
  const EXAM_PERIODS_DICT = {
    0: "Summer",
    1: "Winter", 
    2: "Spring",
  };

  const EXAM_TYPES = {
    0: "Edexcel",
    1: "CIE",
    2: "AQA",
    4: "PHY",
    3: "OTHER",
  };

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<number | ''>('');
  const [filterType, setFilterType] = useState<number | ''>('');

  // 加载考试列表
  const loadExams = async () => {
    setLoading(true);
    try {
      const response = await getExamList();
      if (response.status === 200) {
        setExams(response.data?.active || []);
      } else {
        console.error('获取考试列表失败:', response.message);
      }
    } catch (error) {
      console.error('获取考试列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  // 过滤考试数据
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (exam.topic || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = filterPeriod === '' || exam.period === filterPeriod;
    const matchesType = filterType === '' || exam.type === filterType;
    
    return matchesSearch && matchesPeriod && matchesType;
  });

  // 权限检查
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center gap-4">
            <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exam Signup</h1>
              <p className="text-gray-600">考试管理 - 查看考试信息</p>
            </div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* 搜索框 */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索考试名称、代码或科目..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 期间筛选 */}
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value === '' ? '' : Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">所有期间</option>
                {Object.entries(EXAM_PERIODS_DICT).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>

              {/* 类型筛选 */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value === '' ? '' : Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">所有类型</option>
                {Object.entries(EXAM_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 考试列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : filteredExams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {exam.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {exam.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {exam.topic || '无'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {EXAM_PERIODS_DICT[exam.period as keyof typeof EXAM_PERIODS_DICT] || '未知'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {exam.time ? (typeof exam.time === 'number' ? new Date(exam.time * 1000).toLocaleString('zh-CN') : exam.time) : '未设置'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {exam.location || '未设置'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${exam.price || 0}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">暂无考试数据</p>
            </div>
          )}
        </div>

        {/* 统计信息 */}
        {filteredExams.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">总计: {filteredExams.length} 个考试</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">启用: {filteredExams.length} 个</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
