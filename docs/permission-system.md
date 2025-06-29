# 权限校验与菜单系统文档

## 系统概述

本项目采用基于角色的权限控制（RBAC）系统，支持二级嵌套菜单、动态权限过滤和智能用户重定向。

## 角色权限体系

### 角色定义
- **ADMIN**（管理员）：拥有所有权限
- **TEACHER**（教师）：教学相关权限
- **STUDENT**（学生）：学生基础权限
- **PRE_STUDENT**（报名学生）：报名阶段的受限权限

### 权限映射规则
系统根据用户信息中的type字段自动分配角色：
- `type=1`: STUDENT（正式学生）
- `type=4`: PRE_STUDENT（报名学生，未正式入学）
- 其他类型可扩展为ADMIN或TEACHER

### 权限检查机制
使用`hasPermission(permissionCode)`函数检查用户是否具有特定权限：

```typescript
const { hasPermission } = useAuth();

if (!hasPermission(PERMISSIONS.VIEW_NEW_PAGE)) {
  return <div>无权限访问</div>;
}
```

## 菜单系统架构

### 菜单结构设计
支持二级嵌套菜单，每个菜单项可配置permission属性：

```typescript
interface MenuItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  permission?: string;
  children?: MenuItem[];
}
```

### 权限过滤机制
`filterMenuByPermission`函数自动过滤用户无权限的菜单项：
- **父菜单**：如果所有子菜单都无权限，则隐藏整个父菜单
- **子菜单**：根据permission属性单独过滤
- **动态更新**：用户权限变化时自动重新过滤

### 响应式设计
- **桌面端**：默认展开侧边栏，支持手动折叠
- **移动端**：默认收起，通过汉堡菜单控制
- **自适应**：屏幕尺寸变化时自动调整显示状态

## 用户重定向逻辑

### 登录后重定向策略
`handleUserRedirect`函数根据用户状态智能重定向：

#### PRE_STUDENT用户特殊处理
检查销售信息状态(info_sign)：
- `info_sign=0`: 重定向到`/my-profile`（需要完善资料）
- `info_sign=1`: 重定向到`/my-test`（可以参加测试）

#### 其他用户类型
重定向到`/notification`（通知页面）

### 异常处理
重定向失败时默认导向notification页面，确保用户始终能访问到合适的页面。

## 权限常量定义

所有权限常量统一定义在`/types/auth.ts`的PERMISSIONS对象中：

### 基础权限
- VIEW_NOTIFICATION（查看通知）
- MY_PROFILE（我的资料）
- MY_TEST（我的测试）
- INTERVIEW（面试）
- TEST_SCORE（测试成绩）

### 学校生活权限
- VIEW_SERVICE（预约服务）
- VIEW_BOOK_LOCKER（书柜管理）
- VIEW_EXIT_PERMIT（出门条）
- VIEW_CARD（校园卡）
- VIEW_WEEKEND_PLAN（周末计划）

### 课程相关权限
- VIEW_SCHEDULE（课程安排）
- VIEW_LESSON_TABLE（课程表）
- VIEW_CLASS_SIGNUP（选课报名）

### 图书馆权限
- VIEW_TEXTBOOK（购买教材）
- VIEW_PASTPAPER_TEXTBOOKS（历年试题与教材）

### 考试相关权限
- VIEW_EXAM_SIGNUP（考试报名）
- VIEW_SCORE_REPORT（成绩报告）
- VIEW_LATE_CASHIN（补交费用）
- VIEW_REMARKING（成绩复议）
- VIEW_EXAM_WITHDRAWAL（考试退考）

### 账户管理权限
- VIEW_WARNINGS（查看警告）
- EDIT_PROFILE（编辑资料）
- VIEW_CERTIFICATE_APPLY（证书申请）
- FILE_COMPLAINT（投诉申诉）

## 核心文件说明

### AuthContext.tsx
- 用户登录状态管理
- 角色权限配置（ROLES对象）
- 权限检查函数（hasPermission）
- 用户重定向逻辑

### DashboardLayout.tsx
- 菜单配置（navigation数组）
- 权限过滤（filterMenuByPermission）
- 响应式布局控制
- 菜单激活状态管理

### auth.ts
- API请求统一处理
- 用户重定向函数（handleUserRedirect）
- 销售信息获取（getStudentSalesInfo）

### types/auth.ts
- 权限常量定义（PERMISSIONS）
- 接口类型定义

## 最佳实践

1. **权限粒度**：合理设计权限粒度，避免过细或过粗
2. **命名规范**：权限常量使用大写字母和下划线
3. **菜单配置**：每个菜单项都应配置对应的permission
4. **错误处理**：权限检查失败时提供友好的提示
5. **性能优化**：权限检查结果可适当缓存
6. **安全考虑**：前端权限仅用于UI控制，后端必须有对应验证 