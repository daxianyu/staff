'use client';

import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS, OPERATION_RIGHTS } from '@/types/auth';

export default function PermissionTestPage() {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <div>请先登录</div>;
  }

  const isCoreUser = user.core_user === 1;
  const operationRights = Array.isArray(user.operation_right) ? user.operation_right : [];
  const hasOperationRight11 = operationRights.includes(OPERATION_RIGHTS.WITHDRAWAL_MANAGEMENT);
  const hasOperationRight13 = operationRights.includes(OPERATION_RIGHTS.PS_POLISH);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">权限测试页面</h1>
        
        {/* 用户信息 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">用户信息</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>用户ID:</strong> {user.id}
            </div>
            <div>
              <strong>姓名:</strong> {user.name}
            </div>
            <div>
              <strong>核心用户:</strong> {isCoreUser ? '是' : '否'} ({user.core_user})
            </div>
            <div>
              <strong>操作权限:</strong> {operationRights.join(', ')}
            </div>
            <div>
              <strong>权限11:</strong> {hasOperationRight11 ? '是' : '否'}
            </div>
            <div>
              <strong>权限13:</strong> {hasOperationRight13 ? '是' : '否'}
            </div>
          </div>
          
          {/* 调试信息 */}
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">调试信息</h3>
            <div className="text-xs space-y-1">
              <div><strong>core_user:</strong> {user.core_user} (类型: {typeof user.core_user})</div>
              <div><strong>operation_right:</strong> {JSON.stringify(user.operation_right)} (类型: {typeof user.operation_right})</div>
              <div><strong>isCoreUser:</strong> {isCoreUser.toString()}</div>
              <div><strong>operationRights:</strong> {JSON.stringify(operationRights)}</div>
            </div>
          </div>
        </div>

        {/* 权限测试 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">权限测试结果</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 基础权限 */}
              <div>
                <h3 className="font-medium mb-2">基础权限（所有staff用户）</h3>
                <div className="space-y-1 text-sm">
                  <div className={`p-2 rounded ${hasPermission(PERMISSIONS.VIEW_SUBJECT_EVALUATE) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    科目评价: {hasPermission(PERMISSIONS.VIEW_SUBJECT_EVALUATE) ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${hasPermission(PERMISSIONS.VIEW_EXIT_PERMIT) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    外出申请: {hasPermission(PERMISSIONS.VIEW_EXIT_PERMIT) ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${hasPermission(PERMISSIONS.VIEW_GRADUATION_WISHES) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    毕业祝福: {hasPermission(PERMISSIONS.VIEW_GRADUATION_WISHES) ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${hasPermission(PERMISSIONS.VIEW_MY_CARD) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    我的餐卡: {hasPermission(PERMISSIONS.VIEW_MY_CARD) ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${hasPermission(PERMISSIONS.VIEW_MY_SUBJECTS) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    我的科目: {hasPermission(PERMISSIONS.VIEW_MY_SUBJECTS) ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${hasPermission(PERMISSIONS.VIEW_TRANSCRIPT_APPLY) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    成绩单申请: {hasPermission(PERMISSIONS.VIEW_TRANSCRIPT_APPLY) ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${hasPermission(PERMISSIONS.VIEW_PROMOTE_COMMENT) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    晋升评价: {hasPermission(PERMISSIONS.VIEW_PROMOTE_COMMENT) ? '✓' : '✗'}
                  </div>
                </div>
              </div>

              {/* 需要权限11或核心用户 */}
              <div>
                <h3 className="font-medium mb-2">需要权限11或核心用户</h3>
                <div className="space-y-1 text-sm">
                  <div className={`p-2 rounded ${hasPermission(PERMISSIONS.VIEW_WITHDRAWAL_OVERVIEW) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    退考管理: {hasPermission(PERMISSIONS.VIEW_WITHDRAWAL_OVERVIEW) ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${hasPermission(PERMISSIONS.VIEW_LATE_CASHIN_OVERVIEW) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    成绩补合并: {hasPermission(PERMISSIONS.VIEW_LATE_CASHIN_OVERVIEW) ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${hasPermission(PERMISSIONS.VIEW_REMARK_OVERVIEW) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    备注管理: {hasPermission(PERMISSIONS.VIEW_REMARK_OVERVIEW) ? '✓' : '✗'}
                  </div>
                </div>
              </div>

              {/* 需要权限13或核心用户 */}
              <div>
                <h3 className="font-medium mb-2">需要权限13或核心用户</h3>
                <div className="space-y-1 text-sm">
                  <div className={`p-2 rounded ${hasPermission(PERMISSIONS.VIEW_PS_POLISH) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    PS润色: {hasPermission(PERMISSIONS.VIEW_PS_POLISH) ? '✓' : '✗'}
                  </div>
                </div>
              </div>

              {/* 其他权限 */}
              <div>
                <h3 className="font-medium mb-2">其他权限</h3>
                <div className="space-y-1 text-sm">
                  <div className={`p-2 rounded ${hasPermission(PERMISSIONS.VIEW_SCHEDULE) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    日程管理: {hasPermission(PERMISSIONS.VIEW_SCHEDULE) ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${hasPermission(PERMISSIONS.VIEW_STAFF) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    员工管理: {hasPermission(PERMISSIONS.VIEW_STAFF) ? '✓' : '✗'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
