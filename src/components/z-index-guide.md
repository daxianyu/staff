# Z-Index 层级管理指南

为了避免组件之间的层级冲突，我们建立了以下z-index层级规范：

## 层级规范

| 层级 | z-index | 用途 | 组件示例 |
|------|---------|------|----------|
| 基础层 | 1-9 | 普通元素 | 按钮、输入框 |
| 浮层 | 10-49 | 悬浮提示 | Tooltip、气泡 |
| 弹出层 | 50-99 | 弹出内容 | 下拉菜单、选择器 |
| 遮罩层 | 100-999 | 遮罩背景 | Modal背景 |
| 模态层 | 1000-1099 | 模态框 | AddEventModal |
| 弹出层（Modal内） | 1100-1199 | Modal内的弹出组件 | TimePicker、DropdownMenu |
| 系统层 | 9999+ | 系统级提示 | 全局Toast、确认框 |

## 当前组件z-index设置

### AddEventModal
- 背景遮罩：`z-50` (50)
- 模态框内容：`zIndex: 1000`

### TimePicker
- 弹出框：`zIndex: 1100`
- 原因：需要在Modal之上显示

### DropdownMenu
- 弹出框：`zIndex: 1100`
- 原因：需要在Modal之上显示

## 使用建议

### 1. 普通页面组件
```tsx
// 使用 Tailwind 的 z-index 类
<div className="z-10">弹出内容</div>
```

### 2. Modal内的组件
```tsx
// 使用内联样式确保在Modal之上
<Popover.Content style={{ zIndex: 1100 }}>
  内容
</Popover.Content>
```

### 3. 系统级组件
```tsx
// 使用最高层级
<Toast className="z-[9999]">
  系统通知
</Toast>
```

## 层级检查清单

在开发新组件时，请检查：

- [ ] 组件是否会在Modal中使用？
- [ ] 弹出内容是否会被其他元素遮盖？
- [ ] z-index是否符合层级规范？
- [ ] 是否与现有组件产生冲突？

## 问题排查

如果遇到层级问题：

1. **检查父容器**：确认父容器没有创建新的层叠上下文
2. **检查z-index值**：确保数值符合层级规范
3. **使用开发者工具**：检查实际的z-index计算值
4. **测试不同场景**：在不同容器中测试组件

## 修复记录

### 2025-01-15
- **问题**：TimePicker弹出框被AddEventModal遮盖
- **原因**：TimePicker使用z-50 (50)，AddEventModal使用1000
- **解决**：将TimePicker和DropdownMenu的z-index提升到1100

---

*保持这个文档更新，记录所有z-index相关的决策和修改。* 