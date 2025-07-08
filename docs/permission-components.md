# 权限组件使用指南

## 概述

为了更灵活地进行权限控制，我们提供了一套完整的权限组件和自定义hooks，支持基于角色、权限码、用户类型的多维度权限检查。

## 权限数据来源

- **用户信息存储位置**: `AuthContext.user.data` (来自API返回的userInfo)
- **关键字段**: `user.data.type` (决定用户角色：0=管理员，2=教师，其他=其他角色)
- **权限检查**: 通过用户角色的permissions数组进行权限验证

## 权限组件

### 1. AuthedRole - 基于角色的权限组件

```tsx
import AuthedRole from '@/components/AuthedRole';
import { ROLES } from '@/types/auth';

// 只要是管理员或教师就显示
<AuthedRole roles={[ROLES.ADMIN, ROLES.TEACHER]}>
  <div>管理员和教师可见的内容</div>
</AuthedRole>

// 自定义无权限时的内容
<AuthedRole 
  roles={[ROLES.ADMIN]} 
  fallback={<div>您不是管理员</div>}
>
  <div>管理员专用内容</div>
</AuthedRole>

// 显示默认无权限提示
<AuthedRole roles={[ROLES.ADMIN]} showDefaultFallback>
  <div>管理员功能</div>
</AuthedRole>
```

### 2. AuthedPermission - 基于权限码的权限组件

```tsx
import { AuthedPermission } from '@/components/AuthedRole';
import { PERMISSIONS } from '@/types/auth';

// 任意一个权限即可（默认模式）
<AuthedPermission permissions={[PERMISSIONS.VIEW_SCHEDULE, PERMISSIONS.VIEW_DEMO]}>
  <div>有查看课程或Demo权限的用户可见</div>
</AuthedPermission>

// 需要所有权限
<AuthedPermission 
  permissions={[PERMISSIONS.CREATE_DEMO, PERMISSIONS.EDIT_DEMO]} 
  mode="all"
>
  <div>需要同时拥有创建和编辑权限</div>
</AuthedPermission>
```

### 3. AuthedUserType - 基于用户类型的权限组件

```tsx
import { AuthedUserType } from '@/components/AuthedRole';
import { USER_TYPES } from '@/types/auth';

// 基于API返回的用户类型直接判断
<AuthedUserType types={[USER_TYPES.ADMIN, USER_TYPES.TEACHER]}>
  <div>管理员和教师类型用户可见</div>
</AuthedUserType>
```

## 权限Hooks

### 1. useHasRole - 角色权限检查

```tsx
import { useHasRole } from '@/hooks/usePermissions';
import { ROLES } from '@/types/auth';

function MyComponent() {
  const isAdminOrTeacher = useHasRole([ROLES.ADMIN, ROLES.TEACHER]);
  
  return (
    <div>
      {isAdminOrTeacher && <button>管理功能</button>}
    </div>
  );
}
```

### 2. useHasPermissions - 权限码检查

```tsx
import { useHasPermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/types/auth';

function MyComponent() {
  const canViewSchedule = useHasPermissions([PERMISSIONS.VIEW_SCHEDULE]);
  const canEditAll = useHasPermissions([PERMISSIONS.EDIT_DEMO, PERMISSIONS.DELETE_DEMO], 'all');
  
  return (
    <div>
      {canViewSchedule && <a href="/schedule">查看课程</a>}
      {canEditAll && <button>编辑删除</button>}
    </div>
  );
}
```

### 3. useUserInfo - 综合用户信息

```tsx
import { useUserInfo } from '@/hooks/usePermissions';

function UserProfile() {
  const {
    user,           // 完整用户对象
    userInfo,       // API返回的原始用户数据
    roleId,         // 角色ID
    roleName,       // 角色名称
    userType,       // 用户类型
    isAdmin,        // 是否管理员
    isTeacher,      // 是否教师
    isLoggedIn,     // 是否已登录
    hasRole,        // 角色检查函数
    hasUserType,    // 用户类型检查函数
    hasPermission   // 权限检查函数
  } = useUserInfo();

  return (
    <div>
      <p>当前用户: {user?.username}</p>
      <p>角色: {roleName}</p>
      {isAdmin && <p>您是管理员</p>}
      {hasRole(['admin', 'teacher']) && <p>管理权限</p>}
    </div>
  );
}
```

### 4. 过滤器Hooks

```tsx
import { usePermissionFilter, useRoleFilter } from '@/hooks/usePermissions';

function MenuComponent() {
  const menuItems = [
    { name: '仪表盘', permission: 'view_dashboard' },
    { name: '课程管理', permission: 'view_schedule' },
    { name: '用户管理', permission: 'edit_user' },
  ];

  // 根据权限过滤菜单
  const allowedMenus = usePermissionFilter(menuItems, item => item.permission);

  const features = [
    { name: '系统设置', requiredRoles: ['admin'] },
    { name: '课程管理', requiredRoles: ['admin', 'teacher'] },
  ];

  // 根据角色过滤功能
  const allowedFeatures = useRoleFilter(features, feature => feature.requiredRoles);

  return (
    <div>
      {allowedMenus.map(menu => <div key={menu.name}>{menu.name}</div>)}
      {allowedFeatures.map(feature => <div key={feature.name}>{feature.name}</div>)}
    </div>
  );
}
```

## 常量定义

```tsx
// src/types/auth.ts
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher', 
  OTHER: 'other',
} as const;

export const USER_TYPES = {
  ADMIN: 0,
  TEACHER: 2,
  OTHER: 1,
} as const;

export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_SCHEDULE: 'view_schedule',
  VIEW_DEMO: 'view_demo',
  CREATE_DEMO: 'create_demo',
  EDIT_DEMO: 'edit_demo',
  DELETE_DEMO: 'delete_demo',
} as const;
```

## 最佳实践

1. **优先使用权限码检查**: 更精确和灵活
2. **角色检查适用于大粒度控制**: 页面级别的访问控制
3. **用户类型检查用于特殊业务逻辑**: 直接对应API字段
4. **组合使用**: 可以同时使用多种权限检查方式
5. **性能考虑**: hooks使用useMemo进行了优化

## 迁移指南

原有的权限检查代码可以这样迁移：

```tsx
// 原来的写法
const { hasPermission } = useAuth();
if (hasPermission('view_schedule')) {
  // 渲染内容
}

// 新的组件写法
<AuthedPermission permissions={['view_schedule']}>
  {/* 内容 */}
</AuthedPermission>

// 或者使用新的hook
const canView = useHasPermissions(['view_schedule']);
```

这套权限系统完全兼容现有的AuthContext，只是提供了更多便捷的使用方式。 