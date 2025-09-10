'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// 由于后端API中没有提供Remark相关的接口，这里创建一个占位页面
export default function RemarkOverviewPage() {
  const { hasPermission } = useAuth();

  const canView = hasPermission(PERMISSIONS.VIEW_REMARK_OVERVIEW);
  const canEdit = hasPermission(PERMISSIONS.EDIT_REMARK_OVERVIEW);

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Remark Overview</h1>
          <p className="text-gray-600 mt-1">备注管理</p>
        </div>

        {/* 占位内容 */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">功能开发中</h3>
            <p className="text-gray-500 mb-6">
              此功能需要后端API支持，请联系开发团队添加相关接口。
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="text-sm font-medium text-gray-900 mb-2">需要的API接口：</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• GET /api/user/get_remark_table - 获取备注列表</li>
                <li>• POST /api/user/update_remark_status - 更新备注状态</li>
                <li>• DELETE /api/user/delete_remark - 删除备注</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
