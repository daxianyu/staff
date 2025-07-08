# 课程概览页面 (Lesson Overview)

## 概述

课程概览页面用于查看指定员工在某个月份的课程安排、统计信息和反馈状态。页面路径为 `/lesson-overview/[userId]/[monthId]/`。

## 页面参数

- **userId**: 员工ID（staff_id）
- **monthId**: 月份编号（从1970年1月开始计算的月数）

### 月份计算公式

```javascript
const monthsSince1970 = (year - 1970) * 12 + month;
```

例如：
- 1970年1月 = 0
- 1970年2月 = 1
- 2025年1月 = 660

## 权限要求

用户需要拥有 `view_lesson_overview` 权限才能访问此页面。

## 页面功能

### 三个数据表格

#### 1. 课程详情表格 (Lesson Details)

显示该员工在指定月份的所有课程，包含以下列：

| 列名 | 说明 |
|------|------|
| Campus | 校区名称 |
| Date | 上课日期 |
| Time | 上课时间（开始-结束） |
| Class Name | 班级名称 |
| Lesson Details | 课程详情（课时长度） |
| Feedback Given | 反馈状态（已给反馈/未给反馈） |

#### 2. 按科目统计 (Teaching Hours per Subject)

按科目分组统计总课时：

| 列名 | 说明 |
|------|------|
| Subject | 科目名称（自动分类） |
| Total Lesson Time | 总课时（格式化为小时和分钟） |

**科目分类规则：**
- 包含 "IG Physics" 或 "IG物理" → "CIE IG Physics"
- 包含 "AS Physics" 或 "Physics-AS" → "CIE Physics-AS"
- 包含 "Maths" 或 "数学" → "Edexcel Maths"
- 包含 "IPC" 或 "物理竞赛" → "Physics Competition"
- 其他 → "Other"

#### 3. 按校区统计 (Teaching Hours per Campus)

按校区分组统计总课时：

| 列名 | 说明 |
|------|------|
| Campus | 校区名称 |
| Total Lesson Time | 总课时（格式化为小时和分钟） |

## 访问方式

### 从员工管理页面

1. 进入员工管理页面 (`/staff`)
2. 点击任意员工行右侧的"Action"按钮
3. 在下拉菜单中选择"Lesson Overview"
4. 系统自动跳转到该员工本月的课程概览

### 直接访问

直接访问URL：`/lesson-overview/{员工ID}/{月份编号}/`

## API 接口

页面调用以下API获取数据：

```
GET /api/staff/lesson_overview/{staffId}/{monthId}
```

### 返回数据结构

```json
{
  "status": 0,
  "message": "",
  "data": {
    "campus_lessons": {
      "校区ID": 总课时秒数
    },
    "campus_info": {
      "校区ID": "校区名称"
    },
    "subjects": {
      "科目ID": {
        "class_name": "班级名称",
        "class_id": 班级ID,
        "campus_id": 校区ID,
        "campus_name": "校区名称",
        "topic_id": 主题ID,
        "description": "描述",
        "students": [学生ID数组],
        "lessons": [
          {
            "lesson_id": 课程ID,
            "start_time": 开始时间戳,
            "end_time": 结束时间戳,
            "feedback_given": 反馈状态(1已给,2未给)
          }
        ],
        "total_lesson_length": 科目总课时秒数
      }
    },
    "total_sum": 总课时秒数
  }
}
```

## 时间格式化

### 时间戳转换

```javascript
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return {
    date: date.toLocaleDateString('zh-CN'),
    time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  };
};
```

### 课时格式化

```javascript
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0 && minutes > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
};
```

## 响应式设计

页面支持移动端访问：
- 表格水平滚动
- 触摸友好的交互
- 自适应布局

## 错误处理

### 权限错误
- 显示"Access Denied"页面
- 提示用户无权限访问

### 数据加载错误
- 显示错误提示框
- 显示具体错误信息

### 数据为空
- 各表格显示"暂无数据"提示
- 保持页面结构完整

## 相关文件

- **页面组件**: `src/app/lesson-overview/[userId]/[monthId]/page.tsx`
- **API服务**: `src/services/auth.ts` (getLessonOverview函数)
- **权限定义**: `src/types/auth.ts` (VIEW_LESSON_OVERVIEW)
- **入口链接**: `src/app/staff/page.tsx` (Lesson Overview按钮)

## 开发注意事项

1. **类型安全**: 使用TypeScript接口定义数据结构
2. **权限检查**: 页面级和API级都需要权限验证  
3. **错误边界**: 处理各种异常情况
4. **性能优化**: 大数据量时考虑分页或虚拟滚动
5. **国际化**: 考虑多语言支持的扩展性 