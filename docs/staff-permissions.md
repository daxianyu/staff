# 员工管理页面权限配置

## 页面访问权限

用户需要以下权限之一才能访问员工管理页面：

- `view_staff` - 查看员工
- `finance` - 财务权限 
- `sales_person` - 销售人员权限

## Action 按钮权限

### 查看类操作

以下按钮需要 `view_staff` 权限：

1. **Lesson Overview** - 课程概览
2. **Staff Info** - 员工信息
3. **Staff Schedule** - 员工课表
4. **Default Availability** - 默认可用性

### 编辑类操作

以下按钮需要 `edit_staff` 权限：

5. **Add Staff** - 添加员工
6. **Staff Edit** - 员工编辑
7. **Disable Account** - 禁用账户
   - API: `POST /api/staff/disable_account`

### 删除类操作

8. **Delete Account** - 删除账户
   - 权限要求：`delete_staff`
   - API: `POST /api/staff/delete`

## 其他操作权限

### 添加员工
- 权限要求：`edit_staff`
- API: `POST /api/staff/add`

### 编辑员工
- 权限要求：`edit_staff`
- API: `POST /api/staff/edit`

## 权限检查逻辑

```typescript
// 页面访问权限
const canView = hasPermission(PERMISSIONS.VIEW_STAFF) || 
                hasPermission(PERMISSIONS.FINANCE) || 
                hasPermission(PERMISSIONS.SALES_PERSON);

// 权限检查 - 按功能分类
const canViewStaffDetails = hasPermission(PERMISSIONS.VIEW_STAFF); // 查看类功能
const canEditStaff = hasPermission(PERMISSIONS.EDIT_STAFF);        // 编辑类功能  
const canDeleteStaff = hasPermission(PERMISSIONS.DELETE_STAFF);    // 删除功能

// 是否显示操作菜单
const hasAnyActionPermission = canViewStaffDetails || canEditStaff || canDeleteStaff;
```

## 权限层级说明

1. **无权限用户**：显示"Access Denied"页面
2. **只有 finance/sales_person 权限**：可以查看列表，但操作列显示"-"
3. **有 view_staff 权限**：可以使用查看功能（Lesson Overview, Staff Info, Staff Schedule, Default Availability）
4. **有 edit_staff 权限**：可以添加员工、编辑员工、禁用账户
5. **有 delete_staff 权限**：可以删除员工账户

## 相关API端点

| 功能 | API端点 | 权限要求 |
|------|---------|----------|
| 获取员工列表 | `GET /api/staff/list` | `view_staff` \| `finance` \| `sales_person` |
| 添加员工 | `POST /api/staff/add` | `edit_staff` |
| 编辑员工 | `POST /api/staff/edit` | `edit_staff` |
| 删除员工 | `POST /api/staff/delete` | `delete_staff` |
| 禁用账户 | `POST /api/staff/disable_account` | `edit_staff` |
| 获取老师默认可用性 | `GET /api/staff/teacher_default_availability/{staff_id}` | `view_staff` |
| 获取老师课表 | `GET /api/staff/schedule/{staff_id}/{week_num}` | `view_staff` |

## 注意事项

1. **权限继承**：拥有 `edit_staff` 权限的用户通常也会有 `view_staff` 权限
2. **动态菜单**：根据用户权限动态显示/隐藏操作按钮
3. **权限验证**：前端权限检查仅用于UI优化，实际权限验证在后端进行
4. **用户体验**：无权限时显示"-"而不是空白，提供清晰的视觉反馈

## 测试场景

### 测试用例1：仅有查看权限
- 权限：`view_staff`
- 预期：可以看到4个查看按钮（Lesson Overview, Staff Info, Staff Schedule, Default Availability），无编辑和删除按钮

### 测试用例2：仅有编辑权限
- 权限：`edit_staff`
- 预期：可以添加员工、编辑员工、禁用账户，但无法查看详情和删除

### 测试用例3：查看+编辑权限
- 权限：`view_staff`, `edit_staff`
- 预期：可以查看详情、添加员工、编辑员工、禁用账户，但无法删除

### 测试用例4：完整权限
- 权限：`view_staff`, `edit_staff`, `delete_staff`
- 预期：所有功能都可用

### 测试用例5：财务权限
- 权限：`finance`
- 预期：可以查看列表，但操作列显示"-" 