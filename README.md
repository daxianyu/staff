# Staff Management System

一个基于 Next.js 的员工管理系统，提供完整的权限管理、用户界面和业务功能。

## 项目描述

这是一个现代化的员工管理系统，使用 Next.js 15.2.4 和 React 19 构建。系统包含以下主要功能：

- 🔐 用户认证和权限管理
- 👥 员工信息管理
- 📅 课程和排课管理
- 📊 数据统计和报表
- 🎓 学生管理
- 💳 卡片和消费管理
- 📝 各种业务表单和流程

## 技术栈

- **前端框架**: Next.js 15.2.4
- **UI 库**: React 19.0.0
- **样式**: Tailwind CSS 4.0.17
- **类型安全**: TypeScript 5
- **图标**: Heroicons
- **组件库**: Radix UI
- **表单处理**: React Hook Form
- **日历**: React Big Calendar
- **日期处理**: date-fns, moment
- **Excel 处理**: xlsx

## 如何运行

### 环境要求

- Node.js 18+ 
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

### 生产环境构建

```bash
npm run build
npm run start
```

### 代码检查

```bash
npm run lint
```

## 如何测试

### 运行开发服务器

首先启动开发服务器：

```bash
npm run dev
```

### 手动测试

1. **访问应用**: 打开浏览器访问 [http://localhost:3000](http://localhost:3000)

2. **登录测试**: 
   - 系统会自动重定向到登录页面
   - 使用有效的用户凭据进行登录

3. **功能测试**:
   - 测试不同权限用户的页面访问
   - 验证各个业务模块的功能
   - 检查响应式设计（移动端兼容性）

4. **API 测试**:
   - 检查 API 接口的响应
   - 验证权限控制是否正常工作

### 浏览器兼容性

- iOS >= 16
- Android >= 7
- 现代浏览器 (Chrome, Firefox, Safari, Edge)

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
├── components/             # 可复用组件
├── contexts/              # React Context (认证等)
├── services/              # API 接口服务
├── types/                 # TypeScript 类型定义
├── utils/                 # 工具函数
└── config/                # 配置文件
```

## 主要功能模块

- **用户管理**: 员工信息、权限分配
- **课程管理**: 课程安排、教师分配
- **学生管理**: 学生信息、成绩管理
- **财务管理**: 收费、退费、消费记录
- **报表统计**: 各种业务报表和数据统计
- **系统设置**: 权限配置、菜单管理

## 开发规范

- 使用 TypeScript 确保类型安全
- 遵循 Next.js App Router 规范
- 使用 Tailwind CSS 进行样式管理
- 所有页面必须兼容移动端
- 统一的权限检查和错误处理

## 部署

项目支持静态导出，可以部署到任何静态托管服务：

```bash
npm run build
```

构建后的文件在 `out/` 目录中。

## 许可证

私有项目，仅供内部使用。