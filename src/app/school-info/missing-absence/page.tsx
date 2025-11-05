'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  getMissingAbsence,
  type MissingAbsenceData,
} from '@/services/auth';

export default function MissingAbsencePage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_TEACHING_HOURS_OVERVIEW);

  // 计算当前月份数（从1970年1月开始的月份数）
  const getCurrentMonthNum = useMemo(() => {
    const now = new Date();
    // 根据后端逻辑：month_num = (year - 1970) * 12 + (month - 1)
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    return (year - 1970) * 12 + month;
  }, []);

  // 状态管理
  const [absenceData, setAbsenceData] = useState<MissingAbsenceData>({});
  const [loading, setLoading] = useState(true);
  const [monthNum, setMonthNum] = useState<number>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return (year - 1970) * 12 + month;
  });

  // 根据 month_num 计算时间范围
  const getMonthRange = (monthNum: number): { start: string; end: string } => {
    // 根据后端逻辑：from_month(month) = time.mktime((year, month, 1, ...))
    // year = int(month / 12) + 1970
    // month = month % 12 + 1
    const year = Math.floor(monthNum / 12) + 1970;
    const month = (monthNum % 12) + 1; // 1-12
    
    // 起始时间：当月1日
    const startDate = new Date(year, month - 1, 1);
    
    // 结束时间：下个月1日
    const endDate = new Date(year, month, 1);
    
    // 格式化为 YYYY-MM-DD
    const formatDate = (date: Date): string => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    
    return {
      start: formatDate(startDate),
      end: formatDate(endDate),
    };
  };

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看Missing Absence</p>
        </div>
      </div>
    );
  }

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getMissingAbsence(monthNum);
      if (result.code === 200 && result.data) {
        setAbsenceData(result.data);
      } else {
        console.error('获取Missing Absence失败:', result.message);
        setAbsenceData({});
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setAbsenceData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [monthNum]);

  // 处理上一个月
  const handlePrevious = () => {
    setMonthNum(prev => Math.max(0, prev - 1));
  };

  // 处理下一个月
  const handleNext = () => {
    setMonthNum(prev => prev + 1);
  };

  // 处理重置
  const handleReset = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    setMonthNum((year - 1970) * 12 + month);
  };

  // 转换为数组用于显示
  const absenceList = Object.entries(absenceData)
    .map(([teacherName, count]) => ({ teacherName, count }))
    .sort((a, b) => b.count - a.count);

  // 获取当前月份的时间范围
  const monthRange = getMonthRange(monthNum);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Missing Absence</h1>
          <p className="mt-2 text-sm text-gray-600">查看缺失出勤记录的教师信息</p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 前后跳转按钮 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={monthNum === 0}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="上一月"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="px-4 py-2 bg-gray-50 rounded-lg min-w-[200px] text-center">
                  {loading ? (
                    <span className="text-sm text-gray-500">加载中...</span>
                  ) : (
                    <span className="text-sm font-medium text-gray-700">
                      {monthRange.start} 至 {monthRange.end}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleNext}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-blue-500"
                  title="下一月"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                重置到当前
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
            <div className="h-[600px] overflow-y-auto overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">教师姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">缺失数量</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {absenceList.map((item) => (
                    <tr key={item.teacherName} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.teacherName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.count > 0 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {absenceList.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
