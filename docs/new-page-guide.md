# 新建页面开发指南

## 概述

本指南详细说明如何在项目中创建新页面，包括权限配置、菜单设置、路由创建等完整流程。

## 开发流程

### 1. 权限定义（必须）

在 `src/types/auth.ts` 的 PERMISSIONS 对象中添加新权限：

```typescript
export const PERMISSIONS = {
  // 现有权限...
  VIEW_NEW_PAGE: 'view_new_page',  // 新增权限
  EDIT_NEW_PAGE: 'edit_new_page',  // 如需要编辑权限
} as const;
```

**命名规范：**
- 使用大写字母和下划线
- 采用动词+名词的格式，如：VIEW_SCHEDULE、EDIT_PROFILE
- 保持语义清晰和一致性

### 2. 角色权限配置（必须）

在 `src/contexts/AuthContext.tsx` 的 ROLES 对象中为相应角色添加权限：

```typescript
const ROLES = {
  ADMIN: {
    id: 'admin',
    name: '管理员',
    permissions: [
      // 现有权限...
      PERMISSIONS.VIEW_NEW_PAGE,
      PERMISSIONS.EDIT_NEW_PAGE,
    ]
  },
  STUDENT: {
    id: 'student', 
    name: '学生',
    permissions: [
      // 现有权限...
      PERMISSIONS.VIEW_NEW_PAGE,  // 只给查看权限
    ]
  },
  PRE_STUDENT: {
    id: 'pre_student',
    name: '报名学生', 
    permissions: [
      // PRE_STUDENT通常权限较少
      // 根据需要决定是否添加新权限
    ]
  }
};
```

**权限分配原则：**
- ADMIN：通常拥有所有权限
- TEACHER：根据教学需要分配
- STUDENT：基础学生功能权限
- PRE_STUDENT：报名阶段的受限权限

### 3. 菜单配置（可选）

如果需要在菜单中显示新页面，在 `src/app/components/DashboardLayout.tsx` 的 navigation 数组中添加菜单项：

#### 添加顶级菜单项：
```typescript
const navigation: MenuItem[] = [
  // 现有菜单...
  { 
    name: 'New Page', 
    href: '/new-page', 
    icon: DocumentIcon, 
    permission: PERMISSIONS.VIEW_NEW_PAGE 
  },
];
```

#### 添加到现有父菜单的子菜单：
```typescript
{
  name: 'School Life',
  icon: HomeIcon,
  children: [
    // 现有子菜单...
    { 
      name: 'New Feature', 
      href: '/new-feature', 
      icon: PlusIcon, 
      permission: PERMISSIONS.VIEW_NEW_PAGE 
    },
  ]
}
```

**图标选择：**
- 使用 Heroicons 图标库
- 导入方式：`import { IconName } from '@heroicons/react/24/outline'`
- 选择语义清晰的图标

### 4. 页面文件创建（必须）

在 `src/app/` 目录下创建对应的页面文件，遵循 Next.js 文件系统路由规则：

#### 基础页面结构：
```typescript
// src/app/new-page/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';

export default function NewPage() {
  const { hasPermission } = useAuth();
  
  // 权限检查（推荐）
  if (!hasPermission(PERMISSIONS.VIEW_NEW_PAGE)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">无权限访问</h2>
          <p className="mt-2 text-gray-600">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">新页面标题</h1>
        <p className="mt-2 text-gray-600">页面描述信息</p>
      </div>
      
      {/* 页面内容 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">内容区域</h2>
        {/* 具体内容 */}
      </div>
    </div>
  );
}
```

#### 带子路由的页面结构：
```
src/app/new-page/
  ├── page.tsx          // 主页面
  ├── settings/
  │   └── page.tsx      // 子页面：/new-page/settings
  └── detail/
      └── [id]/
          └── page.tsx  // 动态路由：/new-page/detail/[id]
```

### 5. 样式规范

使用 Tailwind CSS 进行样式开发：

```typescript
// 响应式设计示例
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="bg-white p-4 rounded-lg shadow">
    {/* 卡片内容 */}
  </div>
</div>

// 移动端适配
<div className="px-4 sm:px-6 lg:px-8">
  <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md">
    按钮
  </button>
</div>
```

**样式规范要求：**
- 必须兼容移动端
- 使用原生HTML + Tailwind CSS
- 避免使用Ant Design等第三方UI库
- 模态框遮罩使用 `bg-black/50`

### 6. API服务添加（如需要）

在 `src/services/auth.ts` 中添加相关API请求函数：

```typescript
// 获取新页面数据
export const getNewPageData = async (): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/new-page/data', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取新页面数据异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取数据失败',
    };
  }
};
```

**API规范：**
- 统一在 `services/auth.ts` 中定义
- 使用统一的错误处理格式
- 包含适当的日志记录

### 7. 权限保护组件（高级）

对于需要细粒度权限控制的场景，可以创建权限保护组件：

```typescript
// components/PermissionGuard.tsx
interface PermissionGuardProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ 
  permission, 
  fallback = <div>无权限</div>, 
  children 
}: PermissionGuardProps) {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// 使用示例
<PermissionGuard permission={PERMISSIONS.EDIT_NEW_PAGE}>
  <button>编辑按钮</button>
</PermissionGuard>
```

## 测试检查清单

### 功能测试
- [ ] 页面可以正常访问和显示
- [ ] 权限控制生效（无权限用户看不到菜单/无法访问）
- [ ] 菜单项正确显示和隐藏
- [ ] API请求正常工作
- [ ] 错误处理正确

### 兼容性测试
- [ ] 桌面端布局正常
- [ ] 移动端适配良好
- [ ] 不同屏幕尺寸下显示正确
- [ ] 各浏览器兼容性良好

### 权限测试
- [ ] 不同角色用户的权限差异正确
- [ ] 菜单权限过滤正确
- [ ] 页面级权限检查有效
- [ ] 无权限时的提示友好

## 常见问题

### Q: 为什么新菜单项不显示？
A: 检查以下几点：
1. 是否在 PERMISSIONS 中定义了权限常量
2. 是否在用户角色中添加了对应权限
3. 菜单配置中的 permission 字段是否正确

### Q: 权限检查不生效？
A: 确认：
1. 使用的是 `useAuth()` 钩子的 `hasPermission` 方法
2. 权限常量拼写正确
3. 用户已正确登录且角色分配正确

### Q: 移动端显示异常？
A: 检查：
1. 是否使用了响应式 Tailwind 类
2. 容器宽度是否适配小屏幕
3. 触摸交互是否友好

## 最佳实践总结

1. **权限优先**：先设计权限再开发功能
2. **移动优先**：优先考虑移动端体验
3. **统一风格**：保持与现有页面的设计一致性
4. **错误处理**：提供友好的错误提示和降级方案
5. **性能考虑**：避免不必要的权限检查和渲染
6. **文档维护**：及时更新相关文档 