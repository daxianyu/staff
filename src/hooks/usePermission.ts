import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';
import { PermissionMode } from '@/types/permission';

/**
 * 权限检查相关的自定义hooks
 */

/**
 * 检查单个权限的hook
 * @param permission 权限名称
 * @returns 是否具有该权限
 */
export function usePermission(permission: string): boolean {
  const { hasPermission } = useAuth();
  
  return useMemo(() => {
    return hasPermission(permission);
  }, [permission, hasPermission]);
}

/**
 * 检查多个权限的hook
 * @param permissions 权限名称列表
 * @param mode 检查模式：'any'(任意一个) 或 'all'(全部)
 * @returns 是否具有权限
 */
export function usePermissions(
  permissions: string[], 
  mode: PermissionMode = 'any'
): boolean {
  const { hasAnyPermission, hasAllPermissions } = useAuth();
  
  return useMemo(() => {
    if (mode === 'all') {
      return hasAllPermissions(permissions);
    } else {
      return hasAnyPermission(permissions);
    }
  }, [permissions, mode, hasAnyPermission, hasAllPermissions]);
}

/**
 * 获取当前用户完整信息的hook
 * @returns 用户信息对象，包含权限检查方法
 */
export function useUserInfo() {
  const { user, rights, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  
  return useMemo(() => ({
    // 基础用户信息
    user,
    rights,
    
    // 用户基本信息
    userId: user?.id,
    userName: user?.name,
    userType: user?.type,
    campusId: user?.campus_id,
    
    // 权限检查方法
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // 常用权限检查
    isAdmin: user?.type === 0,
    isTeacher: user?.type === 2,
    
    // 核心权限检查
    isCoreAdmin: hasPermission('core_admin'),
    canViewStaff: hasPermission('view_staff'),
    canEditStaff: hasPermission('edit_staff'),
    canDeleteStaff: hasPermission('delete_staff'),
    canViewStudents: hasPermission('view_students'),
    canEditStudents: hasPermission('edit_students'),
    canAccessFinance: hasPermission('finance'),
    
    // 登录状态
    isLoggedIn: !!user,
  }), [user, rights, hasPermission, hasAnyPermission, hasAllPermissions]);
}

/**
 * 权限过滤器hook - 用于过滤数组中的项目
 * @param items 要过滤的项目数组
 * @param getRequiredPermissions 获取项目所需权限的函数
 * @param mode 权限检查模式
 * @returns 过滤后的项目数组
 */
export function usePermissionFilter<T>(
  items: T[],
  getRequiredPermissions: (item: T) => string[] | undefined,
  mode: PermissionMode = 'any'
): T[] {
  const { hasAnyPermission, hasAllPermissions } = useAuth();
  
  return useMemo(() => {
    return items.filter(item => {
      const requiredPermissions = getRequiredPermissions(item);
      
      // 没有权限要求的项目总是显示
      if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
      }
      
      // 根据模式检查权限
      if (mode === 'all') {
        return hasAllPermissions(requiredPermissions);
      } else {
        return hasAnyPermission(requiredPermissions);
      }
    });
  }, [items, getRequiredPermissions, mode, hasAnyPermission, hasAllPermissions]);
}

/**
 * 检查用户是否具有指定用户类型的hook
 * @param types 允许的用户类型列表
 * @returns 是否具有指定用户类型
 */
export function useHasUserType(types: number[]): boolean {
  const { user } = useAuth();
  
  return useMemo(() => {
    if (!user) return false;
    return types.includes(user.type);
  }, [user, types]);
}

/**
 * 检查用户是否属于指定校区的hook
 * @param campusIds 允许的校区ID列表
 * @returns 是否属于指定校区
 */
export function useHasCampusAccess(campusIds: number[]): boolean {
  const { user } = useAuth();
  
  return useMemo(() => {
    if (!user) return false;
    // 如果用户有跨校区权限，则可以访问所有校区
    if (user.rights.includes('cross_campus_rights')) return true;
    return campusIds.includes(user.campus_id);
  }, [user, campusIds]);
}

/**
 * 用于条件渲染的权限检查hook
 * @param config 权限配置对象
 * @returns 权限检查结果
 */
export function useConditionalPermission(config: {
  permission?: string;
  permissions?: string[];
  mode?: PermissionMode;
  userTypes?: number[];
  campusIds?: number[];
}) {
  const { permission, permissions, mode = 'any', userTypes, campusIds } = config;
  
  const hasPermission = usePermission(permission || '');
  const hasPermissions = usePermissions(permissions || [], mode);
  const hasUserType = useHasUserType(userTypes || []);
  const hasCampusAccess = useHasCampusAccess(campusIds || []);
  
  return useMemo(() => {
    const checks = [];
    
    // 权限检查
    if (permission) {
      checks.push(hasPermission);
    }
    if (permissions && permissions.length > 0) {
      checks.push(hasPermissions);
    }
    
    // 用户类型检查
    if (userTypes && userTypes.length > 0) {
      checks.push(hasUserType);
    }
    
    // 校区检查
    if (campusIds && campusIds.length > 0) {
      checks.push(hasCampusAccess);
    }
    
    // 如果没有任何检查条件，返回true
    if (checks.length === 0) return true;
    
    // 所有检查都必须通过
    return checks.every(check => check);
  }, [hasPermission, hasPermissions, hasUserType, hasCampusAccess, permission, permissions, userTypes, campusIds]);
} 