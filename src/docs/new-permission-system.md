# 新权限系统使用指南

## 🎯 概述

基于实际 API 权限结构设计的权限控制系统，直接使用 `userInfo.rights` 数组中的权限名称，无需复杂的角色映射。

## 🏗️ 系统架构

```
src/
├── types/
│   ├── permission.ts       # 权限相关类型定义
│   └── auth.ts            # 兼容性类型定义
├── contexts/
│   └── AuthContext.tsx    # 权限上下文
├── hooks/
│   └── usePermission.ts   # 权限检查Hook
├── components/
│   └── PermissionGate.tsx # 权限控制组件
├── utils/
│   └── menuFilter.ts      # 菜单过滤工具
└── examples/
    └── NewPermissionExamples.tsx # 使用示例
```

## 📋 快速开始

### 1. 基础权限检查

```tsx
import { usePermission } from '@/hooks/usePermission';
import { COMMON_PERMISSIONS } from '@/types/permission';

function MyComponent() {
  const canViewStaff = usePermission(COMMON_PERMISSIONS.VIEW_STAFF);
  
  return (
    <div>
      {canViewStaff && <button>查看员工</button>}
    </div>
  );
}
```

### 2. 权限控制组件

```tsx
import PermissionGate from '@/components/PermissionGate';
import { COMMON_PERMISSIONS } from '@/types/permission';

function StaffPage() {
  return (
    <div>
      <PermissionGate permission={COMMON_PERMISSIONS.VIEW_STAFF}>
        <StaffList />
      </PermissionGate>
      
      <PermissionGate 
        permissions={[COMMON_PERMISSIONS.EDIT_STAFF, COMMON_PERMISSIONS.DELETE_STAFF]}
        mode="any"
        fallback={<div>需要员工管理权限</div>}
      >
        <StaffActions />
      </PermissionGate>
    </div>
  );
}
```

### 3. 菜单过滤

```tsx
import { getFilteredMenuConfig } from '@/utils/menuFilter';
import { useUserInfo } from '@/hooks/usePermission';

function Navigation() {
  const { user } = useUserInfo();
  const filteredMenu = getFilteredMenuConfig(user);
  
  return (
    <nav>
      {filteredMenu.map(item => (
        <NavItem key={item.key} item={item} />
      ))}
    </nav>
  );
}
```

## 🔧 API 参考

### AuthContext

```tsx
interface AuthContextType {
  user: UserInfo | null;
  rights: string[];                    // 合并后的权限数组
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
```

### 权限检查Hook

```tsx
// 单个权限检查
const canView = usePermission('view_staff');

// 多个权限检查
const canManage = usePermissions(['edit_staff', 'delete_staff'], 'any');

// 用户类型检查
const isAdmin = useHasUserType([USER_TYPES.ADMIN]);

// 校区权限检查
const hasCampusAccess = useHasCampusAccess([1, 2]);

// 综合权限检查
const canAccess = useConditionalPermission({
  permissions: ['view_staff'],
  userTypes: [USER_TYPES.ADMIN],
  campusIds: [1, 2]
});
```

### 权限控制组件

```tsx
// 基础权限控制
<PermissionGate permission="view_staff">
  <StaffList />
</PermissionGate>

// 多权限控制
<PermissionGate permissions={['edit_staff', 'delete_staff']} mode="any">
  <StaffActions />
</PermissionGate>

// 高级权限控制
<AdvancedPermissionGate 
  permissions={['view_students']}
  userTypes={[USER_TYPES.ADMIN, USER_TYPES.TEACHER]}
  campusIds={[1, 2]}
>
  <StudentManagement />
</AdvancedPermissionGate>

// 预定义组件
<AdminOnly>
  <AdminPanel />
</AdminOnly>

<TeacherOnly>
  <TeacherPanel />
</TeacherOnly>
```

## 🎨 使用模式

### 1. 页面级权限控制

```tsx
function StaffPage() {
  return (
    <PermissionGate 
      permission={COMMON_PERMISSIONS.VIEW_STAFF}
      fallback={<div>无权限访问</div>}
    >
      <div>
        <h1>员工管理</h1>
        <StaffList />
        
        <PermissionGate permission={COMMON_PERMISSIONS.CREATE_STAFF}>
          <CreateStaffButton />
        </PermissionGate>
      </div>
    </PermissionGate>
  );
}
```

### 2. 条件渲染

```tsx
function StaffActions() {
  const canEdit = usePermission(COMMON_PERMISSIONS.EDIT_STAFF);
  const canDelete = usePermission(COMMON_PERMISSIONS.DELETE_STAFF);
  
  return (
    <div className="flex gap-2">
      {canEdit && <button>编辑</button>}
      {canDelete && <button>删除</button>}
    </div>
  );
}
```

### 3. 列表过滤

```tsx
function ActionList() {
  const actions = [
    { name: '查看员工', permission: 'view_staff' },
    { name: '编辑员工', permission: 'edit_staff' },
    { name: '删除员工', permission: 'delete_staff' },
  ];
  
  const allowedActions = usePermissionFilter(
    actions,
    (action) => [action.permission]
  );
  
  return (
    <div>
      {allowedActions.map(action => (
        <button key={action.name}>{action.name}</button>
      ))}
    </div>
  );
}
```

## 🔄 迁移指南

### 从旧权限系统迁移

```tsx
// 旧写法
const { hasPermission } = useAuth();
if (hasPermission('view_staff')) {
  // 渲染内容
}

// 新写法 - 使用Hook
const canView = usePermission('view_staff');
if (canView) {
  // 渲染内容
}

// 新写法 - 使用组件
<PermissionGate permission="view_staff">
  {/* 内容 */}
</PermissionGate>
```

### 菜单配置迁移

```tsx
// 旧菜单配置
const menuItems = [
  { name: '员工管理', path: '/staff', permission: 'view_staff' }
];

// 新菜单配置
const menuItems = [
  { 
    key: 'staff',
    label: '员工管理', 
    path: '/staff', 
    requiredPermissions: ['view_staff'] 
  }
];
```

## 💡 最佳实践

1. **优先使用权限组件**：声明式的权限控制更清晰
2. **合理使用权限过滤**：对于列表和菜单，使用过滤器更高效
3. **权限名称统一**：使用 `COMMON_PERMISSIONS` 常量避免硬编码
4. **错误处理**：为无权限状态提供合适的 fallback
5. **性能优化**：Hook 已经进行了 memoization 优化

## 🐛 常见问题

### Q: 如何处理复杂的权限逻辑？
A: 使用 `useConditionalPermission` Hook 进行多维度权限检查。

### Q: 如何实现权限继承？
A: 菜单过滤器会自动处理父子级权限关系。

### Q: 如何调试权限问题？
A: 使用 `useUserInfo` Hook 查看当前用户的所有权限。

## 📚 示例代码

完整的使用示例请查看 `src/examples/NewPermissionExamples.tsx` 文件。 