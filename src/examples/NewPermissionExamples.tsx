import React, { useMemo } from 'react';
import PermissionGate, { 
  AdvancedPermissionGate, 
  AdminOnly, 
  TeacherOnly,
  FinanceOnly,
  StaffManagementOnly,
  StudentManagementOnly 
} from '@/components/PermissionGate';
import { 
  usePermission, 
  usePermissions, 
  useUserInfo,
  usePermissionFilter,
  useHasUserType,
  useHasCampusAccess,
  useConditionalPermission
} from '@/hooks/usePermission';
import { COMMON_PERMISSIONS } from '@/types/permission';
import { PERMISSIONS, USER_TYPES } from '@/types/auth';
import { getFilteredMenuConfig } from '@/utils/menuFilter';

/**
 * 新权限系统使用示例
 * 基于实际的 API 权限结构
 */

export default function NewPermissionExamples() {
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">新权限系统使用示例</h1>
      
      {/* 基础权限控制组件 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">1. 基础权限控制</h2>
        
        {/* 单个权限检查 */}
        <PermissionGate permission={COMMON_PERMISSIONS.VIEW_STAFF}>
          <div className="bg-blue-100 p-4 rounded mb-4">
            <h3 className="font-semibold">员工管理模块</h3>
            <p>只有有 view_staff 权限的用户才能看到这个内容</p>
          </div>
        </PermissionGate>

        {/* 多个权限检查（任意一个） */}
        <PermissionGate 
          permissions={[COMMON_PERMISSIONS.EDIT_STAFF, COMMON_PERMISSIONS.DELETE_STAFF]} 
          mode="any"
        >
          <div className="bg-green-100 p-4 rounded mb-4">
            <h3 className="font-semibold">员工操作按钮</h3>
            <p>有编辑或删除员工权限的用户可以看到</p>
          </div>
        </PermissionGate>

        {/* 多个权限检查（全部满足） */}
        <PermissionGate 
          permissions={[COMMON_PERMISSIONS.FINANCE, COMMON_PERMISSIONS.VIEW_ACCOUNTING]} 
          mode="all"
          fallback={<div className="text-red-500">需要财务和会计权限</div>}
        >
          <div className="bg-yellow-100 p-4 rounded mb-4">
            <h3 className="font-semibold">财务报表</h3>
            <p>需要同时拥有财务和会计权限</p>
          </div>
        </PermissionGate>
      </section>

      {/* 高级权限控制组件 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">2. 高级权限控制</h2>
        
        {/* 基于用户类型和权限的综合检查 */}
        <AdvancedPermissionGate 
          permissions={[COMMON_PERMISSIONS.VIEW_STUDENTS]}
          userTypes={[USER_TYPES.STAFF]}
          fallback={<div className="text-red-500">需要管理员或教师权限且有学生查看权限</div>}
        >
          <div className="bg-purple-100 p-4 rounded mb-4">
            <h3 className="font-semibold">学生管理面板</h3>
            <p>管理员或教师类型用户且有学生查看权限</p>
          </div>
        </AdvancedPermissionGate>

        {/* 校区权限检查 */}
        <AdvancedPermissionGate 
          permissions={[COMMON_PERMISSIONS.VIEW_CLASSROOMS]}
          campusIds={[1, 2]} // 只有校区1和2的用户可以访问
          showNoPermission={true}
        >
          <div className="bg-indigo-100 p-4 rounded mb-4">
            <h3 className="font-semibold">教室管理</h3>
            <p>特定校区的教室管理功能</p>
          </div>
        </AdvancedPermissionGate>
      </section>

      {/* 预定义权限组件 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">3. 预定义权限组件</h2>
        
        <AdminOnly showNoPermission={true}>
          <div className="bg-red-100 p-4 rounded mb-4">
            <h3 className="font-semibold">系统管理</h3>
            <p>只有核心管理员可以访问</p>
          </div>
        </AdminOnly>

        <TeacherOnly fallback={<div className="text-gray-500">需要教师权限</div>}>
          <div className="bg-blue-100 p-4 rounded mb-4">
            <h3 className="font-semibold">教师功能</h3>
            <p>教师和管理员可以访问</p>
          </div>
        </TeacherOnly>

        <FinanceOnly showNoPermission={true}>
          <div className="bg-green-100 p-4 rounded mb-4">
            <h3 className="font-semibold">财务功能</h3>
            <p>需要财务权限</p>
          </div>
        </FinanceOnly>

        <StaffManagementOnly>
          <div className="bg-yellow-100 p-4 rounded mb-4">
            <h3 className="font-semibold">员工管理功能</h3>
            <p>需要员工管理相关权限</p>
          </div>
        </StaffManagementOnly>
      </section>

      {/* Hook 使用示例 */}
      <HookExamples />
    </div>
  );
}

/**
 * Hook 使用示例组件
 */
function HookExamples() {
  // 基础权限检查
  const canViewStaff = usePermission(COMMON_PERMISSIONS.VIEW_STAFF);
  const canEditStaff = usePermission(COMMON_PERMISSIONS.EDIT_STAFF);
  const canDeleteStaff = usePermission(COMMON_PERMISSIONS.DELETE_STAFF);
  
  // 多权限检查
  const canManageStaff = usePermissions([
    COMMON_PERMISSIONS.EDIT_STAFF, 
    COMMON_PERMISSIONS.DELETE_STAFF
  ], 'any');
  
  const canFullyManageStaff = usePermissions([
    COMMON_PERMISSIONS.VIEW_STAFF,
    COMMON_PERMISSIONS.EDIT_STAFF,
    COMMON_PERMISSIONS.DELETE_STAFF
  ], 'all');
  
  // 用户类型检查
  const isAdminOrTeacher = useHasUserType([USER_TYPES.STAFF]);
  
  // 校区权限检查
  const hasCampusAccess = useHasCampusAccess([1, 2]);
  
  // 综合权限检查
  const canAccessFinance = useConditionalPermission({
    permissions: [COMMON_PERMISSIONS.FINANCE],
    userTypes: [USER_TYPES.STAFF],
    campusIds: [1, 2]
  });
  
  // 用户信息
  const {
    user,
    rights,
    userName,
    userType,
    isAdmin,
    isTeacher,
    isCoreAdmin,
    canViewStaff: canViewStaffFromHook,
    canEditStaff: canEditStaffFromHook,
    canAccessFinance: canAccessFinanceFromHook,
    isLoggedIn
  } = useUserInfo();
  
  // 模拟数据列表
  const actionButtons = [
    { name: '查看员工', permission: COMMON_PERMISSIONS.VIEW_STAFF },
    { name: '编辑员工', permission: COMMON_PERMISSIONS.EDIT_STAFF },
    { name: '删除员工', permission: COMMON_PERMISSIONS.DELETE_STAFF },
    { name: '查看学生', permission: COMMON_PERMISSIONS.VIEW_STUDENTS },
    { name: '编辑学生', permission: COMMON_PERMISSIONS.EDIT_STUDENTS },
    { name: '财务管理', permission: COMMON_PERMISSIONS.FINANCE },
  ];
  
  // 权限过滤
  const allowedActions = usePermissionFilter(
    actionButtons,
    (action) => [action.permission]
  );
  
  // 菜单过滤
  const filteredMenu = useMemo(() => {
    return getFilteredMenuConfig(user);
  }, [user]);
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">4. Hook 使用示例</h2>
      
      {/* 权限检查结果 */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">权限检查结果：</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p>查看员工: {canViewStaff ? '✅' : '❌'}</p>
            <p>编辑员工: {canEditStaff ? '✅' : '❌'}</p>
            <p>删除员工: {canDeleteStaff ? '✅' : '❌'}</p>
            <p>管理员工: {canManageStaff ? '✅' : '❌'}</p>
            <p>完全管理员工: {canFullyManageStaff ? '✅' : '❌'}</p>
          </div>
          <div>
            <p>管理员或教师: {isAdminOrTeacher ? '✅' : '❌'}</p>
            <p>校区权限: {hasCampusAccess ? '✅' : '❌'}</p>
            <p>财务权限: {canAccessFinance ? '✅' : '❌'}</p>
          </div>
        </div>
      </div>

      {/* 用户信息展示 */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">用户信息：</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p>用户名: {userName}</p>
            <p>用户类型: {userType}</p>
            <p>登录状态: {isLoggedIn ? '已登录' : '未登录'}</p>
          </div>
          <div>
            <p>是否管理员: {isAdmin ? '是' : '否'}</p>
            <p>是否教师: {isTeacher ? '是' : '否'}</p>
            <p>是否核心管理员: {isCoreAdmin ? '是' : '否'}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-600">
          用户权限: {rights.join(', ')}
        </p>
      </div>

      {/* 过滤后的操作按钮 */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">可用操作：</h3>
        <div className="flex flex-wrap gap-2">
          {allowedActions.map((action, index) => (
            <button
              key={index}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              {action.name}
            </button>
          ))}
        </div>
      </div>

      {/* 过滤后的菜单 */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">可访问菜单：</h3>
        <div className="space-y-2">
          {filteredMenu.map((item) => (
            <div key={item.key} className="text-sm">
              <div className="font-medium">{item.label}</div>
              {item.children && (
                <div className="ml-4 space-y-1">
                  {item.children.map((child) => (
                    <div key={child.key} className="text-gray-600">
                      • {child.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 条件渲染示例 */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">条件渲染示例：</h3>
        <div className="space-y-2">
          {canViewStaff && (
            <div className="p-2 bg-blue-200 rounded">
              <button className="text-blue-800">查看员工列表</button>
            </div>
          )}
          
          {canEditStaff && (
            <div className="p-2 bg-green-200 rounded">
              <button className="text-green-800">编辑员工信息</button>
            </div>
          )}
          
          {canDeleteStaff && (
            <div className="p-2 bg-red-200 rounded">
              <button className="text-red-800">删除员工</button>
            </div>
          )}
          
          {!canViewStaff && !canEditStaff && !canDeleteStaff && (
            <div className="p-2 bg-gray-200 rounded text-gray-600">
              您没有员工管理权限
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 