# Staff 项目文档

## 项目概述

Staff 项目是一个基于 Next.js 14 的学生管理系统，当前专注于**课程安排**核心功能，采用简化的权限管理体系。

## 当前功能状态

### ✅ 已实现功能
- **课程安排系统** (`/schedule`) - 主要功能，支持日历视图
- **用户登录** (`/login`) - 用户认证系统
- **权限管理** - 基于角色的访问控制（RBAC）
- **403错误页面** - 无权限访问处理

### 🔄 预留功能（菜单已配置，页面待实现）
- **个人资料** (`/my-profile`) - 用户信息管理
- **我的测试** (`/my-test`) - 学生测试功能
- **面试管理** (`/interview`) - 面试安排与管理
- **测试成绩** (`/test-score`) - 成绩查看
- **通知系统** (`/notifications`) - 消息通知

## 文档目录

### 系统架构文档
- [权限校验与菜单系统](./permission-system.md) - 简化权限系统架构说明
- [新建页面开发指南](./new-page-guide.md) - 详细的页面开发流程

### 功能模块文档
- [课程安排系统](./schedule.md) - 课程安排相关功能
- [课程安排演示](./schedule-demo.md) - 课程安排功能演示

## 快速开始

1. **查看主要功能**：访问 `/schedule` 查看课程安排
2. **新建页面**：参考 [新建页面开发指南](./new-page-guide.md)
3. **权限配置**：查看 [权限系统文档](./permission-system.md)
4. **开发规范**：查看项目根目录的 `.cursor/rules/global.mdc`

## 项目结构

```
staff/
├── src/
│   ├── app/              # Next.js 页面
│   │   ├── schedule/     # ✅ 课程安排（已实现）
│   │   ├── login/        # ✅ 登录页面（已实现）
│   │   ├── 403/          # ✅ 错误页面（已实现）
│   │   └── components/   # 布局组件
│   ├── components/       # 共享组件
│   ├── contexts/         # React Context
│   ├── services/         # API服务
│   ├── types/           # TypeScript类型定义
│   └── utils/           # 工具函数
├── docs/                # 项目文档
└── .cursor/rules/       # 开发规则
```

## 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS + Radix UI
- **状态管理**: React Context
- **权限控制**: 简化的基于角色的权限控制(RBAC)
- **图标**: Heroicons
- **日历组件**: React Big Calendar

## 权限角色说明

### 👑 ADMIN（管理员）
- 拥有所有系统权限
- 可以访问管理功能
- 包含未来管理员专属功能

### 👨‍🏫 TEACHER（教师）
- 教学相关权限
- 课程管理和学生测试
- 面试和成绩管理

## 开发规范

请查看 `.cursor/rules/global.mdc` 了解详细的开发规范，包括：
- 技术栈约束（原生HTML + Tailwind CSS）
- 代码风格要求
- API组织规范
- 权限配置要求
- 移动端兼容性要求

## 扩展计划

基于当前项目状态，建议的功能扩展顺序：

1. **Phase 1 - 用户管理**
   - [ ] 完善 `/my-profile` 个人资料页面
   - [ ] 实现用户信息编辑功能

2. **Phase 2 - 通知系统**
   - [ ] 实现 `/notifications` 通知功能
   - [ ] 添加消息推送机制

## 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 相关项目

- **website** - 完整功能的学生管理系统（参考实现）
- **phy** - 后端API服务

---

**当前版本**: 简化版 v1.0  
**主要功能**: 课程安排系统  
**下一步**: 个人资料管理功能 