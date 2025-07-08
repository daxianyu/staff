# 菜单系统迁移说明

## 迁移概述

本次迁移将 DashboardLayout 中的旧菜单系统替换为新的权限驱动菜单系统。

## 主要变更

### 1. 菜单配置集中化

- **旧系统**：菜单配置在 `DashboardLayout.tsx` 中硬编码
- **新系统**：菜单配置在 `src/utils/menuFilter.ts` 中集中管理

### 2. 菜单数据结构变更

| 属性 | 旧字段 | 新字段 |
|------|--------|--------|
| 菜单标识 | `name` | `key` |
| 菜单名称 | `name` | `label` |
| 菜单链接 | `href` | `path` |
| 图标 | `icon` (组件) | `icon` (字符串) |
| 权限 | `permission` | `requiredPermissions` |

### 3. 权限检查优化

- **旧系统**：每个菜单项手动检查权限
- **新系统**：使用统一的 `MenuFilter` 类过滤菜单

### 4. 图标系统改进

- **旧系统**：直接使用 React 组件
- **新系统**：字符串映射 + 动态组件解析

## 文件变更

### 更新的文件

- `src/app/components/DashboardLayout.tsx` - 主要布局组件
- `src/utils/menuFilter.ts` - 菜单配置（添加 Demo 页面）

### 新建的文件

- `src/components/MenuDebugger.tsx` - 菜单调试组件

## 新增功能

### 1. 菜单调试器

- 显示过滤后的菜单项
- 显示权限要求
- 显示菜单统计信息

### 2. 更灵活的权限配置

- 支持多种权限模式（任意/全部）
- 支持用户类型限制
- 支持校区权限检查

### 3. 图标映射表

```typescript
const iconMap: Record<string, React.ElementType> = {
  'dashboard': HomeIcon,
  'calendar': CalendarIcon,
  'users': UserGroupIcon,
  // ... 更多图标
};
```

## 菜单配置示例

```typescript
{
  key: 'schedule',
  label: '课程安排',
  path: '/schedule',
  icon: 'calendar',
  requiredPermissions: ['edit_staff'],
}
```

## 向后兼容性

- 保持所有原有菜单项
- 保持权限检查逻辑
- 保持视觉样式一致

## 使用方法

### 添加新菜单项

1. 在 `src/utils/menuFilter.ts` 中的 `defaultMenuConfig` 添加菜单项
2. 设置相应的权限要求
3. 选择合适的图标

### 调试菜单

1. 登录系统后，点击右下角的"菜单调试"按钮
2. 查看当前用户可见的菜单项
3. 检查权限配置是否正确

### 权限配置

- `requiredPermissions`: 用户需要其中任一权限
- `requiredAllPermissions`: 用户需要所有权限
- `allowedUserTypes`: 限制用户类型
- `allowedCampuses`: 限制校区

## 常见问题

### Q: 为什么菜单项不显示？

A: 检查以下几点：
1. 用户是否有相应权限
2. 菜单配置是否正确
3. 权限名称是否匹配

### Q: 如何添加子菜单？

A: 在菜单项中添加 `children` 数组：

```typescript
{
  key: 'parent',
  label: '父菜单',
  children: [
    {
      key: 'child',
      label: '子菜单',
      path: '/child',
      requiredPermissions: ['view_child'],
    }
  ]
}
```

### Q: 如何更改图标？

A: 
1. 在 `iconMap` 中添加新图标映射
2. 在菜单配置中使用对应的字符串键

## 性能优化

- 菜单过滤使用 memoization
- 权限检查结果缓存
- 图标组件懒加载

## 测试建议

1. 使用不同权限的用户测试菜单显示
2. 检查子菜单的权限过滤
3. 验证图标显示正确
4. 测试移动端菜单功能

## 后续计划

1. 添加菜单排序功能
2. 支持动态菜单配置
3. 添加菜单使用统计
4. 菜单国际化支持 