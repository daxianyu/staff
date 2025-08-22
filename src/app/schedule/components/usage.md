下面是一份「可直接给团队同事看的」**AddEventModal 使用文档**。我把**组件能力、Props 说明、数据结构、回调协议、典型用例、定位与交互、性能注意事项、FAQ、迁移指南**都写全了，拎着就能用。

---

# AddEventModal 使用文档

## 1. 概述

`AddEventModal` 是一个**日程安排弹窗**组件，支持三种场景：

* **添加监考（invigilate）**
* **添加/编辑课程（lesson）**（仅在编辑已有课程时出现课程字段）
* **添加不可用时段（unavailable）** + 冲突删除

支持：

* 时间选择与 15 分钟自动对齐
* 250ms 去抖的**冲突检测**
* 删除课程支持“删除 N 周”
* 只读详情视图（ReadOnly）
* ESC 关闭、轻量动画、窗口内智能定位、标题栏拖拽

> 注意：`TimePicker`、`Button`、`NumberInput` 为项目内组件，需在宿主项目中可用。

---

## 2. 安装与依赖

* React 18+
* TypeScript
* `moment`（内部使用；全项目若要替换为 `dayjs` 可后续统一）
* Tailwind 样式类仅用于美化；若项目未接入 Tailwind，不影响核心逻辑，但样式需自定

---

## 3. Props 一览

```ts
interface AddEventModalProps {
  isOpen: boolean;                       // 是否显示弹窗
  onClose: () => void;                   // 关闭回调（含ESC）

  // 时间变更（用户在弹窗内调整时间时持续回调）
  onTimeChange: (startTime: string, endTime: string) => void;

  // 保存回调（点击“保存”触发）
  onSave: (event: Partial<ScheduleEvent> & {
    repeat?: 'none' | 'weekly';
    subject?: string;
    campus?: string;
    pickRoom?: string;
    replaceRoomWhenBooked?: boolean;
    id?: string;
    mode?: 'add' | 'edit';
    topic_id?: string;
    note?: string;
    repeat_num?: number;
  }) => void;

  // 选中的日期 & 可选的预选择时间范围
  selectedDate?: Date;
  selectedTimeRange?: { start: Date; end: Date };

  // 定位辅助（参考点/光标位置）
  position?: { x: number; y: number; slideDirection?: 'left' | 'right' | 'center' };

  onAnimationComplete?: () => void;      // 关闭动画结束时回调

  // 冲突检测：组件内部会在用户改时间后 250ms 去抖调用
  onConflictCheck?: (start: Date, end: Date) => Array<{ start: Date; end: Date }>;

  // 各种下拉数据
  scheduleData?: any;                    // 建议按“数据结构”一节约定的 shape

  isSaving?: boolean;                    // 保存/删除中，按钮进入 loading 态
  mode?: 'add' | 'edit';                 // 添加 or 编辑
  readOnly?: boolean;                    // 只读详情

  initialEvent?: any;                    // 编辑/只读时的初始事件（详见“数据结构”）
  onDelete?: (repeat_num?: number) => void; // 删除课程时可传删除周数；监考不传
  onDeleteUnavailable?: (conflicts: Array<{start: Date; end: Date}>) => void; // 删除不可用冲突块
  onEditFromReadOnly?: () => void;       // 只读态切换到编辑态
}
```

> **变更提示**：老版本中的 `onRepeatChange`、`onRefreshData`、`staffId` 已移除。

---

## 4. 数据结构约定（建议）

> 组件当前对 `scheduleData`/`initialEvent` 用了 `any`，强烈建议在项目内声明以下接口，避免类型不明带来的维护成本。

```ts
// ScheduleEvent（供参考）
interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  teacherId: string;
  teacherName: string;
  type: 'lesson' | 'unavailable' | 'invigilate';
  description?: string;
  repeat?: 'none' | 'weekly';
}

// 下拉数据结构（建议）
interface ScheduleData {
  class_topics?: Record<string, string>;   // 监考科目：id -> name
  campus_info?: Record<string, string>;    // 校区：id -> name
  room_info?: Record<string, string>;      // 教室：id -> name
  staff_class?: Record<string, string>;    // 教师的课程：id -> name
}

// 初始事件（建议）
interface InitialEvent {
  id: string;
  type: 'lesson'|'unavailable'|'invigilate';
  start: Date | string;
  end: Date | string;
  title?: string;
  description?: string;
  repeat?: 'none'|'weekly';
  subject?: string;
  subject_name?: string;
  campus?: string;
  room_id?: number;
  pickRoom?: string;
  replaceRoomWhenBooked?: boolean;

  topic_id?: string;  // 监考科目
  note?: string;      // 监考备注
  repeat_num?: number;

  class_id?: string|number; // 课程跳转用
  teacherId?: string;
  teacherName?: string;
  students?: string;
  student_name?: string;
}
```

---

## 5. 回调协议（重点）

### 5.1 onTimeChange

* 触发时机：用户在弹窗内变更开始/结束时间
* 形参：`(startTimeHHmm, endTimeHHmm)`，形如 `"09:00"`

### 5.2 onSave（点击“保存”）

* 传参字段会因类型不同有选择性传递：

  * 基本：`start: Date`, `end: Date`, `type`, `repeat`
  * 若类型为 `lesson`：`subject`, `campus`, `pickRoom`, `replaceRoomWhenBooked`,（可含 `repeat_num`）
  * 若类型为 `invigilate`：`topic_id`, `note`
  * 若 `mode="edit"`：会包含 `id`；且若 `initialEvent` 中有 `teacherId/teacherName` 会一并带上
* 你可在后端按 `type` 分支处理，或在前端提交前二次清理无关字段

### 5.3 onConflictCheck（去抖 250ms）

* 形参：`(start: Date, end: Date)`
* 返回：`Array<{start: Date; end: Date}>`（表示与当前时间段冲突的“不可用段”）
* 组件内处理：

  * 若返回非空，底部按钮区域进入\*\*仅允许“删除不可用时间段”\*\*的模式
  * 点击将调用 `onDeleteUnavailable?.(conflicts)`

### 5.4 onDelete

* 编辑模式下点击“删除”
* 课程：会传 `repeat_num`（来自弹窗中“删除周数”）
* 监考：调用 `onDelete?.()` 不传参数（仅删除本次）

---

## 6. 典型用例

### 6.1 添加监考（默认）

```tsx
const [open, setOpen] = useState(false);

function App() {
  const scheduleData = {
    class_topics: { '1': '数学', '2': '英语' },
    campus_info:  { 'c1': '主校区' },
    room_info:    { 'r1': 'A101', 'r2': 'A102' },
  };

  const handleSave = (payload: any) => {
    // payload.type === 'invigilate'
    // 包含 start/end/topic_id/note 等
    console.log('save invigilate:', payload);
    setOpen(false);
  };

  const handleConflictCheck = (start: Date, end: Date) => {
    // 返回与 [start, end] 冲突的不可用时段
    return []; // 示例无冲突
  };

  return (
    <>
      <button onClick={() => setOpen(true)}>添加监考</button>
      <AddEventModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onTimeChange={() => {}}
        onSave={handleSave}
        selectedDate={new Date()}
        scheduleData={scheduleData}
        onConflictCheck={handleConflictCheck}
      />
    </>
  );
}
```

### 6.2 编辑课程

```tsx
const initialEvent: InitialEvent = {
  id: 'evt-1',
  type: 'lesson',
  title: '高二数学',
  subject: 'sub-001',
  subject_name: '函数与导数',
  campus: 'c1',
  room_id: 101,
  start: new Date('2025-08-22T10:00:00'),
  end:   new Date('2025-08-22T11:00:00'),
  repeat: 'weekly',
  repeat_num: 8,
  class_id: 'cls-1',
  teacherId: 't-1',
  teacherName: '张老师',
};

<AddEventModal
  isOpen
  onClose={() => {}}
  mode="edit"
  initialEvent={initialEvent}
  selectedDate={new Date(initialEvent.start)}
  onSave={(p) => console.log('edit lesson payload', p)}
  onDelete={(repeat_num) => console.log('delete lesson, weeks=', repeat_num)}
  onTimeChange={() => {}}
/>
```

> 在编辑课程模式下，类型选择会禁用，仅展示“课程”，并展示课程跳转按钮（编辑/详情）。

### 6.3 只读详情 + 进入编辑

```tsx
<AddEventModal
  isOpen
  onClose={() => {}}
  readOnly
  mode="edit"
  initialEvent={initialEvent}
  selectedDate={new Date(initialEvent.start)}
  onEditFromReadOnly={() => { /* 切换外层状态 -> readOnly=false */ }}
  onTimeChange={() => {}}
  onSave={() => {}}
/>
```

### 6.4 删除不可用冲突段

当 `onConflictCheck` 返回非空时，弹窗只会显示“删除不可用时间段”按钮：

```tsx
<AddEventModal
  ...
  onConflictCheck={(s, e) => [
    { start: new Date('2025-08-22T10:00:00'), end: new Date('2025-08-22T10:30:00') }
  ]}
  onDeleteUnavailable={(conflicts) => {
    // 调用接口删除这些不可用段
    console.log('delete unavailable:', conflicts);
  }}
/>
```

---

## 7. 定位与交互

* 默认会尝试**智能定位**到选中区域附近；找不到时居中显示。
* 你也可以传入 `position={{ x, y, slideDirection }}` 来指定弹窗基准位置（常用：鼠标坐标）。
* 弹窗支持**标题栏拖拽**（原生 mouse 事件）；拖拽中禁用过渡动画，保证跟手。
* 按 `ESC` 可关闭。

> 现实现依赖一次 `querySelector` 去尝试获取“选中事件”的 DOM（通过样式匹配）。如果你的样式或结构不一致，**建议完全依赖 `position` 参数**来控制显示位置（更稳）。

---

## 8. 行为细节

* **时间窗口**：`09:00`～`22:00`（常量位于文件顶部 `DAY_START_TIME/END`，可按项目需要调整）
* **时间联动**：

  * 当开始时间 ≥ 结束时间，会自动把结束时间向后推 15 分钟（不超过最晚时间）
  * 当结束时间 ≤ 开始时间，会自动把开始时间向前拉 15 分钟（不早于最早时间）
* **冲突**：有冲突时仅允许删除不可用段，不允许保存
* **按钮 Loading**：传入 `isSaving` 控制“保存中…”/“删除中…”

---

## 9. 性能与可访问性建议

* 冲突检测已内置 **250ms 去抖**，避免频繁请求
* 大块计算（如定位）已尽量局部化；若需要进一步优化，可把定位逻辑抽到 hook 并用 `useMemo`/`ResizeObserver`（后续可按项目演进）
* 建议在外层给弹窗容器补充无障碍属性（如 `role="dialog"`, `aria-modal="true"`, `aria-labelledby`），便于读屏

---

## 10. 常见问题（FAQ）

**Q1：为什么我在“添加”模式看不到“课程”选项？**
A：当前下拉只提供“监考/不可用”。“课程”相关字段在**编辑已有课程**时展示（`mode="edit"` 且 `initialEvent.type === 'lesson'`）。

**Q2：`teacherId/teacherName` 从哪里来？**
A：**不再写死**。若 `initialEvent` 中存在，则在保存时自动透传；否则不传。建议在父组件里统一提供。

**Q3：冲突删除是怎么触发的？**
A：当 `onConflictCheck` 返回非空，底部只会显示“删除不可用时间段”按钮，点击会把 `conflicts` 原样传给 `onDeleteUnavailable`。

**Q4：为什么课程删除会多一个“删除周数”？**
A：课程支持按周重复；删除时可指定连续删除 N 周。监考不支持多周删除。

---

## 11. 迁移指南（从旧版到新版）

* ✅ **删除**：`onRepeatChange`, `onRefreshData`, `staffId`
* ✅ **新增行为**：`onConflictCheck` 去抖（250ms）
* ✅ **常量外移**：`DAY_START_TIME/END` 在文件顶部，可统一配置
* ✅ **保存时不再写死教师信息**：需要由 `initialEvent` 或父组件传入

---

## 12. 提交数据示例

### 12.1 保存监考（添加）

```json
{
  "start": "2025-08-22T09:00:00.000Z",
  "end": "2025-08-22T09:30:00.000Z",
  "type": "invigilate",
  "repeat": "none",
  "topic_id": "1",
  "note": "提前 10 分钟到场",
  "mode": "add"
}
```

### 12.2 保存课程（编辑）

```json
{
  "id": "evt-1",
  "start": "2025-08-22T10:00:00.000Z",
  "end": "2025-08-22T11:00:00.000Z",
  "type": "lesson",
  "repeat": "weekly",
  "repeat_num": 8,
  "subject": "sub-001",
  "campus": "c1",
  "pickRoom": "r1",
  "replaceRoomWhenBooked": false,
  "teacherId": "t-1",
  "teacherName": "张老师",
  "mode": "edit"
}
```

---

## 13. 小贴士（可选增强）

* 若你的上层有“选中日历块”的 DOM，可传入 `position` 使用该块中心点坐标，替换组件内的样式匹配定位，更稳。
* 如果你的项目希望**键盘可操作**（无鼠标），可在 footer 增加默认焦点或添加 Tab 顺序优化。
* 未来若切换 `moment`，本组件替换点主要在 `format('HH:mm')/format('YYYY-MM-DD')` 与 `set({hour,minute})`。

---

有需要的话，我可以再给你一版**父组件模板**（包含：锚点定位、冲突 mock、保存/删除的接口占位）直接可跑。
