import React from 'react';
import { PermissionGateProps } from '@/types/permission';
import { usePermission, usePermissions, useHasUserType, useHasCampusAccess } from '@/hooks/usePermission';

/**
 * 权限控制组件
 * 根据用户权限决定是否渲染内容
 */
export default function PermissionGate({
  permission,
  permissions,
  mode = 'any',
  fallback,
  showNoPermission = false,
  children,
}: PermissionGateProps) {
  // 权限检查
  const hasSinglePermission = usePermission(permission || '');
  const hasMultiplePermissions = usePermissions(permissions || [], mode);
  
  // 判断是否有权限
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasSinglePermission;
  } else if (permissions && permissions.length > 0) {
    hasAccess = hasMultiplePermissions;
  } else {
    // 没有指定权限要求，默认允许访问
    hasAccess = true;
  }
  
  // 如果有权限，渲染内容
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // 没有权限时的处理
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showNoPermission) {
    return (
      <div className="text-center p-4 text-gray-500">
        <div className="text-lg mb-2">🔒</div>
        <div>暂无权限访问此内容</div>
      </div>
    );
  }
  
  // 默认不渲染任何内容
  return null;
}

/**
 * 扩展的权限控制组件
 * 支持更多的权限检查维度
 */
export function AdvancedPermissionGate({
  permission,
  permissions,
  mode = 'any',
  userTypes,
  campusIds,
  fallback,
  showNoPermission = false,
  children,
}: PermissionGateProps & {
  userTypes?: number[];
  campusIds?: number[];
}) {
  // 权限检查
  const hasSinglePermission = usePermission(permission || '');
  const hasMultiplePermissions = usePermissions(permissions || [], mode);
  const hasUserType = useHasUserType(userTypes || []);
  const hasCampusAccess = useHasCampusAccess(campusIds || []);
  
  // 判断是否有权限
  let hasAccess = true;
  
  // 权限检查
  if (permission) {
    hasAccess = hasAccess && hasSinglePermission;
  }
  if (permissions && permissions.length > 0) {
    hasAccess = hasAccess && hasMultiplePermissions;
  }
  
  // 用户类型检查
  if (userTypes && userTypes.length > 0) {
    hasAccess = hasAccess && hasUserType;
  }
  
  // 校区检查
  if (campusIds && campusIds.length > 0) {
    hasAccess = hasAccess && hasCampusAccess;
  }
  
  // 如果有权限，渲染内容
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // 没有权限时的处理
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showNoPermission) {
    return (
      <div className="text-center p-4 text-gray-500">
        <div className="text-lg mb-2">🔒</div>
        <div>暂无权限访问此内容</div>
      </div>
    );
  }
  
  // 默认不渲染任何内容
  return null;
}

/**
 * 管理员权限组件
 * 只有管理员可以访问
 */
export function AdminOnly({
  fallback,
  showNoPermission = false,
  children,
}: {
  fallback?: React.ReactNode;
  showNoPermission?: boolean;
  children: React.ReactNode;
}) {
  return (
    <PermissionGate
      permission="core_admin"
      fallback={fallback}
      showNoPermission={showNoPermission}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * 教师权限组件
 * 教师和管理员可以访问
 */
export function TeacherOnly({
  fallback,
  showNoPermission = false,
  children,
}: {
  fallback?: React.ReactNode;
  showNoPermission?: boolean;
  children: React.ReactNode;
}) {
  return (
    <AdvancedPermissionGate
      userTypes={[0, 2]} // 0: 管理员, 2: 教师
      fallback={fallback}
      showNoPermission={showNoPermission}
    >
      {children}
    </AdvancedPermissionGate>
  );
}

/**
 * 财务权限组件
 * 只有有财务权限的用户可以访问
 */
export function FinanceOnly({
  fallback,
  showNoPermission = false,
  children,
}: {
  fallback?: React.ReactNode;
  showNoPermission?: boolean;
  children: React.ReactNode;
}) {
  return (
    <PermissionGate
      permission="finance"
      fallback={fallback}
      showNoPermission={showNoPermission}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * 员工管理权限组件
 * 需要员工管理相关权限
 */
export function StaffManagementOnly({
  fallback,
  showNoPermission = false,
  children,
}: {
  fallback?: React.ReactNode;
  showNoPermission?: boolean;
  children: React.ReactNode;
}) {
  return (
    <PermissionGate
      permissions={['view_staff', 'edit_staff', 'delete_staff']}
      mode="any"
      fallback={fallback}
      showNoPermission={showNoPermission}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * 学生管理权限组件
 * 需要学生管理相关权限
 */
export function StudentManagementOnly({
  fallback,
  showNoPermission = false,
  children,
}: {
  fallback?: React.ReactNode;
  showNoPermission?: boolean;
  children: React.ReactNode;
}) {
  return (
    <PermissionGate
      permissions={['view_students', 'edit_students', 'delete_students']}
      mode="any"
      fallback={fallback}
      showNoPermission={showNoPermission}
    >
      {children}
    </PermissionGate>
  );
} 