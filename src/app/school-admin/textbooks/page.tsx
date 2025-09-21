'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ExclamationTriangleIcon, BookOpenIcon } from '@heroicons/react/24/outline';


export default function TextbooksPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission('edit_books');

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有访问教材管理页面的权限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">教材管理</h1>
          <p className="mt-2 text-sm text-gray-600">此页面正在开发中，敬请期待</p>
        </div>
      </div>
    </div>
  );
}