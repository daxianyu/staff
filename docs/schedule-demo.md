# 教师排课系统 Demo

## 功能介绍

本 demo 实现了一个基于 React Big Calendar 的教师排课系统，包含以下核心功能：

### 📅 日历视图
- **日视图**：查看单天的详细课程安排
- **周视图**：查看一周的课程安排（默认视图）
- **月视图**：查看整月的课程概览

### 📚 课程管理
- **课程安排**：绿色显示，表示正式课程
- **可用时段**：浅绿色显示，表示教师可安排课程的时间
- **不可用时段**：红色显示，表示教师不可用的时间（如会议、休假等）

### ✨ 交互功能
- **点击空白时段**：快速添加新的课程安排
- **点击现有事件**：查看课程详情
- **拖拽支持**：可拖拽调整课程时间（待实现）

## 访问方式

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 在浏览器中访问：`http://localhost:3000/schedule`

## 技术实现

### 依赖库
- `react-big-calendar`：日历组件
- `moment`：时间处理
- `@heroicons/react`：图标库
- `tailwindcss`：样式框架

### 核心组件
- `/src/app/schedule/page.tsx`：主页面组件
- `/src/app/schedule/components/AddEventModal.tsx`：添加课程模态框

### 数据结构
```typescript
interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  teacherId: string;
  teacherName: string;
  type: 'course' | 'available' | 'unavailable';
  description?: string;
}
```

## 扩展方向

根据技术方案文档，后续可以扩展的功能包括：

1. **后端集成**：连接 REST API，实现数据持久化
2. **重复规则**：支持周期性课程安排（RRULE）
3. **冲突检测**：防止时间冲突的课程安排
4. **权限管理**：教师只能管理自己的课程
5. **导出功能**：支持 iCal 格式导出
6. **通知系统**：课程变更时推送通知

## 样式说明

- 使用 Tailwind CSS 进行样式设计
- 背景使用 `bg-black/50` 模态遮罩
- 响应式设计，支持移动端查看
- 图例说明不同类型的时段含义 