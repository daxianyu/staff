'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ScheduleRedirectPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();

  const canView = hasPermission(PERMISSIONS.VIEW_STAFF);

  useEffect(() => {
    if (canView) {
      // 重定向到现有的schedule页面
      router.push('/schedule');
    }
  }, [canView, router]);

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

  // 显示加载状态
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">正在跳转到日程页面...</p>
      </div>
    </div>
  );
}
