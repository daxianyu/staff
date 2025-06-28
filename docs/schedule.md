下面给出一个**完整且优化后的教师排课系统技术方案**，把前面几轮讨论（Teams 功能拆解、Google Calendar Payload 解析、REST API 草案等）整理成一份自洽的“蓝图”。你可以直接据此落地实现，也方便后续扩展。

---

## 1  功能范围一览

| 模块        | 关键能力                       | 备注                                            |
| --------- | -------------------------- | --------------------------------------------- |
| **日历视图**  | 日 / 周 视图；拖拽新建、调整课程块        | `react-big-calendar` or `@fullcalendar/react` |
| **可用时段**  | 固定 Repeat（如每周一 9-12）+ 临时可用 | 绿色/半透明背景区                                     |
| **不可用时段** | 休假、会议、考试等；可单次或重复           | 灰色/红色背景区                                      |
| **课程安排**  | 标题、教师、时间段、重复规则             | 冲突检测、批量删除                                     |
| **重复规则**  | `RRULE`（推荐直接存字符串）          | 周期：Daily / Weekly / Monthly；BYDAY             |
| **权限**    | 老师管理自己课表；管理员可全局            | NextAuth / JWT                                |

---

## 2  数据模型（PostgreSQL + Prisma 示例）

```prisma
model Teacher {
  id          String   @id @default(cuid())
  name        String
  events      Event[]
  availability Availability[]
  unavailability Unavailability[]
}

model Event {
  id              String   @id @default(cuid())
  teacherId       String
  title           String
  start           DateTime
  end             DateTime
  repeatRuleId    String?      // 可为空
  repeatRule      RepeatRule?  @relation(fields: [repeatRuleId], references: [id])
  createdAt       DateTime @default(now())
}

model RepeatRule {
  id          String   @id @default(cuid())
  freq        String   // "daily" | "weekly" | "monthly"
  byDay       String?  // 逗号分隔：MO,TU
  until       DateTime?
}

model Availability {
  id          String   @id @default(cuid())
  teacherId   String
  weekday     Int      // 0-6
  startTime   String   // "09:00"
  endTime     String
  repeat      Boolean  // 固定每周
}

model Unavailability {
  id          String   @id @default(cuid())
  teacherId   String
  start       DateTime
  end         DateTime
  reason      String?
}
```

> **优化点**
>
> * 重复规则拆一张表，避免每条事件冗余；同时保留 `repeatRuleId=null` 表示单次课程
> * `Availability` 存相对时间（不带日期），减少行数并天然“全年生效”
> * `Unavailability` 直接存绝对区间，查询时按时间窗口过滤即可

---

## 3  REST API 设计（最终版）

### 3.1  课程安排

| 动作       | 方法 & 路径                                      | 说明             |
| -------- | -------------------------------------------- | -------------- |
| **创建课程** | `POST /api/events`                           | 支持重复           |
| **查询课程** | `GET  /api/events?teacherId=…&start=…&end=…` | 前端按视图范围加载      |
| **更新课程** | `PATCH /api/events/:id`                      | 仅修改单个或系列       |
| **删除课程** | `DELETE /api/events/:id?all=true`            | `all=true` 批量删 |

#### 创建课程请求体

```jsonc
{
  "teacherId": "t001",
  "title": "高三数学",
  "start": "2025-07-23T10:15:00+08:00",
  "end":   "2025-07-23T11:45:00+08:00",
  "repeat": {
    "freq": "weekly",
    "byDay": ["MO", "WE"],
    "until": "2025-08-24T00:00:00+08:00"
  }
}
```

### 3.2  可/不可用时段

| 路径                                                            | 说明 |
| ------------------------------------------------------------- | -- |
| `POST /api/availability` / `DELETE /api/availability/:id`     |    |
| `POST /api/unavailability` / `DELETE /api/unavailability/:id` |    |

---

## 4  业务逻辑优化

1. **冲突检测**：

   * 新建或更新课程时，SQL 查询 `[start,end)` 交叉且同老师的课程/不可用时段，若存在返回 409 Conflict。
2. **批量生成子事件 vs. 动态展开**：

   * 后端仅存父事件 + `RRULE`；查询接口根据 `start`-`end` 在内存里展开（`rrule` npm 包）。优点：数据库更轻，修改重复规则只动一行。
3. **时区统一**：

   * 数据库存 UTC；前端送上 ISO 带 `+08:00`；API 统一用 ISO 字符串，避免 DST/夏令时问题。
4. **软删除策略**：

   * 课程频繁增删，建议 `deletedAt` 字段做软删，保留审计。

---

## 5  前端组件选型与交互

| 需求    | 方案                                     |
| ----- | -------------------------------------- |
| 日历呈现  | `react-big-calendar`（内置拖拽，易自定义样式）      |
| 移动端优化 | Tailwind `sm:` `md:` 断点 + 日视图滚动        |
| 表单    | `react-hook-form` + Zod 校验             |
| 状态管理  | TanStack Query 拉取/缓存；Zustand 管本地 UI 状态 |
| 冲突提示  | 表单提交后 toast ⛔ “时段与已有课程冲突”              |

---

## 6  性能与安全

* **批量接口**：同一教师一次性添加多个事件可走 `POST /api/events/batch`，内部事务处理。
* **缓存层**：课表是读多写少，可加 `GET /api/events` 响应 Cache-Control 30s。
* **乐观锁**：`events` 表加 `version` 字段，防止并发修改。
* **权限**：老师只能操作自己的记录；管理员可带 `X-Admin: true` 头放行。
* **日志审计**：所有 PATCH/DELETE 写入 `event_log`，字段：userId、eventId、action、timestamp、diff。

---

## 7  拓展方向

1. **学生端查询接口**：`GET /api/public-events?classId=…`
2. **iCal 导出**：生成 `.ics`，供老师导入手机日历。
3. **通知服务**：课程变更时推 Web Push / 邮件。
4. **GraphQL**：后期可改成单端点，支持更灵活查询。

---

### 🚀 结语

以上方案将复杂的 Google Calendar 内部协议 & Teams 完整功能，**抽取成面向教师排课的最小闭环**。

* **数据库模型** 单一、正交，可支撑冲突检测与重复课。
* **API** 语义清晰，前后端联调简单。
* **可用 / 不可用** 分离，保证后期好维护。

如果你要进入实作阶段：

1. 先用 Prisma 建好表并生成 TypeScript 类型；
2. 写 `POST /api/events`，集成 `rrule` 解析；
3. 在 `react-big-calendar` 里用 TanStack Query 拉接口。

需要任何具体代码示例或单个模块的深入实现，随时告诉我！祝你排课顺利完成 🎉
