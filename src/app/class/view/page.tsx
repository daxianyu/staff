'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';

export default function ClassViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const classId = searchParams.get('id');

  // 权限检查
  const canViewClasses = hasPermission(PERMISSIONS.VIEW_CLASSES);

  useEffect(() => {
    if (!canViewClasses) {
      setError('无权限查看课程');
      setLoading(false);
      return;
    }

    if (!classId) {
      setError('缺少课程ID参数');
      setLoading(false);
      return;
    }

    // TODO: 获取课程详情数据
    setLoading(false);
  }, [classId, canViewClasses]);

  if (!canViewClasses) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">权限不足</h2>
            <p className="text-gray-600">您没有权限查看课程</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">出错了</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">课程详情</h1>
            <p className="text-gray-600 mt-1">课程ID: {classId}</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => router.push(`/class/edit?id=${classId}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              编辑
            </button>
            <button 
              onClick={() => router.back()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      </div>

      {/* 课程信息卡片 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">基本信息</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              课程名称
            </label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              CIE IG Physics
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              课程ID
            </label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              {classId}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              班级ID
            </label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              50845
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              授课教师
            </label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              金鹏
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              学生数量
            </label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              0
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              评分
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-500">★★★★★</span>
              <span className="text-gray-900">5.0</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            课程描述
          </label>
          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
            暂无描述
          </p>
        </div>
      </div>

      {/* 学生列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">学生名单</h2>
        
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>暂无学生</p>
        </div>
      </div>
    </div>
  );
} 