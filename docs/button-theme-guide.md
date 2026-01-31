# 按钮主题样式使用指南

## 概述

项目中的主要操作按钮现在统一使用主题 JSON 中定义的按钮颜色，确保按钮样式与主题保持一致。

## 使用方法

### 方法1：使用 CSS 类 `.btn-primary`

最简单的使用方式，直接添加 `btn-primary` 类：

```tsx
<button className="btn-primary px-4 py-2 rounded-md">
  提交
</button>
```

### 方法2：使用 Tailwind 工具类

使用自定义的 Tailwind 工具类：

```tsx
<button className="bg-primary text-primary hover:bg-primary-hover px-4 py-2 rounded-md">
  提交
</button>
```

### 方法3：使用内联样式（CSS 变量）

直接使用 CSS 变量：

```tsx
<button 
  style={{
    backgroundColor: 'var(--button-primary-bg)',
    color: 'var(--button-primary-text)',
  }}
  className="px-4 py-2 rounded-md hover:opacity-90"
>
  提交
</button>
```

### 方法4：使用 Button 组件（推荐）

使用统一的 Button 组件：

```tsx
import { Button } from '@/components/Button';

<Button variant="primary" size="md">
  提交
</Button>
```

## 替换现有按钮

### 替换前：
```tsx
<button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
  提交
</button>
```

### 替换后（方法1）：
```tsx
<button className="btn-primary px-4 py-2 text-sm font-medium rounded-md">
  提交
</button>
```

### 替换后（方法2）：
```tsx
<button className="bg-primary text-primary hover:bg-primary-hover px-4 py-2 text-sm font-medium rounded-md">
  提交
</button>
```

### 替换后（方法4 - 推荐）：
```tsx
<Button variant="primary" size="sm">
  提交
</Button>
```

## 主题颜色说明

按钮颜色会根据当前主题自动变化：

- **默认主题**: `#1e3965` (深蓝色)
- **橙色主题**: `#fc9a55` (橙色)
- **蓝色主题**: `#63bbcf` (浅蓝色)

## 注意事项

1. **主要操作按钮**：使用主题颜色（`.btn-primary` 或 `bg-primary`）
2. **次要按钮**：可以使用 `bg-white border border-gray-300` 等样式
3. **危险操作**：保持使用 `bg-red-600` 等红色样式
4. **成功操作**：可以使用 `bg-green-600` 等绿色样式

## 常见按钮类型

### 主要操作按钮（使用主题色）
```tsx
<button className="btn-primary px-4 py-2 rounded-md">
  保存 / 提交 / 确认
</button>
```

### 次要按钮
```tsx
<button className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
  取消
</button>
```

### 危险操作按钮
```tsx
<button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
  删除
</button>
```
