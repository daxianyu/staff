# 员工管理权限调整说明

## 调整概述

根据用户需求，重新调整了员工管理页面各个按钮的权限要求，使权限分配更加合理和细粒度。

## 权限变更详情

### 🔍 查看类功能（需要 `view_staff` 权限）
- ✅ Lesson Overview - 课程概览
- ✅ Staff Info - 员工信息  
- ✅ Staff Schedule - 员工课表
- ✅ Default Availability - 默认可用性

### ✏️ 编辑类功能（需要 `edit_staff` 权限）
- ✅ Add Staff - 添加员工
- ✅ Staff Edit - 员工编辑 **（权限要求从 view_staff 改为 edit_staff）**
- ✅ Disable Account - 禁用账户

### 🗑️ 删除类功能（需要 `delete_staff` 权限）
- ✅ Delete Account - 删除账户

## 主要变更

### 1. Staff Edit 按钮权限调整
**变更前：** 需要 `view_staff` 权限  
**变更后：** 需要 `edit_staff` 权限

**理由：** 编辑员工信息是修改操作，应该需要编辑权限而不是查看权限。

### 2. 权限分组优化
重新设计了权限检查逻辑，按功能分组：

```typescript
// 变更前
const canViewStaffDetails = hasPermission(PERMISSIONS.VIEW_STAFF);
const canEdit = hasPermission(PERMISSIONS.EDIT_STAFF);
const canDelete = hasPermission(PERMISSIONS.DELETE_STAFF);

// 变更后  
const canViewStaffDetails = hasPermission(PERMISSIONS.VIEW_STAFF); // 查看类功能
const canEditStaff = hasPermission(PERMISSIONS.EDIT_STAFF);        // 编辑类功能
const canDeleteStaff = hasPermission(PERMISSIONS.DELETE_STAFF);    // 删除功能
```

### 3. 代码一致性改进
- 统一使用新的权限变量名
- 更新了所有相关的权限检查
- 保持了代码逻辑的清晰和一致性

## 影响范围

### 代码文件
- `src/app/staff/page.tsx` - 主要权限逻辑更新
- `docs/staff-permissions.md` - 权限文档更新

### 用户体验
- **仅有 view_staff 权限的用户**：无法再看到"Staff Edit"按钮
- **有 edit_staff 权限的用户**：可以使用完整的编辑功能
- **权限组合用户**：体验更加符合直觉

## 测试建议

### 推荐测试场景

1. **仅查看权限测试**
   ```
   权限：view_staff
   预期：只能看到 4 个查看按钮，无编辑/删除按钮
   ```

2. **仅编辑权限测试**  
   ```
   权限：edit_staff
   预期：只能看到编辑相关按钮，无查看/删除按钮
   ```

3. **组合权限测试**
   ```
   权限：view_staff + edit_staff
   预期：可以查看详情和编辑，但无法删除
   ```

4. **完整权限测试**
   ```
   权限：view_staff + edit_staff + delete_staff  
   预期：所有功能都可用
   ```

### 验证重点

- ✅ 权限边界明确：不同权限用户看到的功能严格区分
- ✅ 功能逻辑正确：有权限的用户可以正常使用功能  
- ✅ UI反馈清晰：无权限时按钮正确隐藏或显示"-"
- ✅ 权限继承：多权限组合时功能正确累加

## 向后兼容性

- ✅ **API兼容**：后端API权限验证无变化
- ✅ **基础功能**：现有用户的核心功能不受影响
- ⚠️ **UI变化**：仅有 view_staff 权限的用户将看不到"Staff Edit"按钮

## 注意事项

1. **权限设计原则**：遵循最小权限原则，确保用户只能访问其角色需要的功能
2. **前端权限检查**：这些权限检查主要用于UI优化，实际安全验证仍在后端进行
3. **权限调试**：可以使用权限调试工具测试不同权限组合的效果

## 相关文档

- 📄 [员工管理页面权限配置](./staff-permissions.md)
- 📄 [权限调试功能说明](./permission-debugger.md)
- 📄 [新权限系统文档](./new-permission-system.md) 