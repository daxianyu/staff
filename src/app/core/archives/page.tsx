'use client';

import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

export default function ArchivesPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_ARCHIVES);

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看档案管理</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <WrenchScrewdriverIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Archives</h1>
          <p className="mt-2 text-lg text-gray-500">档案管理</p>
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <ArchiveBoxIcon className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">页面开发中</h3>
            <p className="text-gray-500">此页面正在开发中，敬请期待。</p>
            <p className="text-sm text-gray-400 mt-2">预期功能：文档档案管理、数据归档、历史记录查询等</p>
          </div>
        </div>
      </div>
    </div>
  );
}
