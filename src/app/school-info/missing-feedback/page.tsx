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
  getMissingFeedback,
  type MissingFeedbackData,
} from '@/services/auth';

export default function MissingFeedbackPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_TEACHING_HOURS_OVERVIEW);

  // 计算周数（从1970年1月1日开始的周数）
  const getWeekNum = (date: Date): number => {
    const start = new Date(1970, 0, 1); // 1970年1月1日
    const diff = date.getTime() - start.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    // 1970年1月1日是周四，我们需要调整到周一
    // 后端逻辑：减去4天，前端保持一致
    const adjustedDays = days - 4;
    
    // 如果调整后的天数小于0，说明在第一周内
    if (adjustedDays < 0) {
      return 0;
    }
    
    return Math.floor(adjustedDays / 7);
  };

  // 计算当前周数并转换为time_unit（week_num除以2取整）
  const getCurrentTimeUnit = useMemo(() => {
    const now = new Date();
    const weekNum = getWeekNum(now);
    return Math.floor(weekNum / 2);
  }, []);

  // 状态管理
  const [feedbackData, setFeedbackData] = useState<MissingFeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeUnit, setTimeUnit] = useState<number>(getCurrentTimeUnit);

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看Missing Feedback</p>
        </div>
      </div>
    );
  }

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getMissingFeedback(timeUnit);
      if (result.code === 200 && result.data) {
        setFeedbackData(result.data);
      } else {
        console.error('获取Missing Feedback失败:', result.message);
        setFeedbackData(null);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setFeedbackData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeUnit]);

  // 处理上一期
  const handlePrevious = () => {
    setTimeUnit(prev => Math.max(0, prev - 1));
  };

  // 处理下一期
  const handleNext = () => {
    setTimeUnit(prev => prev + 1);
  };

  // 处理重置
  const handleReset = () => {
    setTimeUnit(getCurrentTimeUnit);
  };

  // 转换为数组用于显示
  const feedbackList = feedbackData?.result 
    ? Object.entries(feedbackData.result)
        .map(([teacherName, count]) => ({ teacherName, count }))
        .sort((a, b) => b.count - a.count)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Missing Feedback</h1>
          <p className="mt-2 text-sm text-gray-600">查看缺失反馈的教师信息</p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 前后跳转按钮 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={timeUnit === 0}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="上一期"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="px-4 py-2 bg-gray-50 rounded-lg min-w-[200px] text-center">
                  {loading ? (
                    <span className="text-sm text-gray-500">加载中...</span>
                  ) : feedbackData && feedbackData.start_time && feedbackData.end_time ? (
                    <span className="text-sm font-medium text-gray-700">
                      {feedbackData.start_time} 至 {feedbackData.end_time}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">暂无数据</span>
                  )}
                </div>
                <button
                  onClick={handleNext}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-blue-500"
                  title="下一期"
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
                  {feedbackList.map((item) => (
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
                  {feedbackList.length === 0 && (
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
