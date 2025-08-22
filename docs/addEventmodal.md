方宝在！我先把这份 `AddEventModal.tsx` 过了一遍，给你一份“能立刻动手”的修改清单：**可删/可改/可拆/可提速**，再配几段关键代码片段。你可以按优先级一步步落地。

---

# 一、可以直接删/下沉的代码（安全改动，优先）

1. **未使用的 props**

* `onRepeatChange?`：组件内完全未调用，**删掉 prop 定义与入参**。
* `onRefreshData?`：未使用，**删掉**。
* `staffId?`：未使用，**删掉**。

> 这样能立刻减少组件 API 噪音，降低后续维护成本。

2. **组件内纯常量下沉到组件外**

* `DAY_START_TIME`, `DAY_END_TIME` 是常量；放到组件外，避免每次 render 重建。

3. **Type 强化**

* `initialEvent?: any`、`scheduleData?: any` 建议定义成明确的接口（见文末类型建议）。
* `ScheduleEvent` 里 `title` 现在只读不写，但 UI 会显示，没问题；保持即可。

---

# 二、明显的小 Bug / 逻辑隐患（尽快修）

1. **“重复”选择框没有任何选项**

```tsx
<select value={repeat} onChange={...}>
  {/* 空的！*/} 
</select>
```

➡️ 应该补上：

```tsx
<select
  value={repeat}
  onChange={(e) => setRepeat(e.target.value as 'none' | 'weekly')}
  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
>
  <option value="none">不重复</option>
  <option value="weekly">每周</option>
</select>
```

2. **注释与代码不符**

> “不可用事件默认为‘重复’” —— 代码是 `setRepeat('none')`。
> 保持“不可用=不重复”更合理，**改注释**避免误导。

3. **硬编码教师信息**
   `handleSubmit` 里写死 `teacherId: 'teacher1'`, `teacherName: '张老师'`。
   ➡️ 建议：从 `initialEvent` 或父层传入；若拿不到，**不要写死**（否则后端数据容易脏）。

4. **利用 CSS 值的 DOM 查询非常脆弱**

```ts
document.querySelector('[class*="rbc-event"][style*="rgb(216, 27, 96)"]')
```

➡️ 强依赖样式，后续一改样式即失效。建议让父组件**传入选中锚点的 `DOMRect`** 或者传一个唯一 data-attr，避免样式耦合（下面给出 `useSmartModalPosition` 方案）。

---

# 三、性能热点 & 优化建议（按收益排序）

### P1：`calculateModalProps` 每次 render 都做 DOM 读写

* 它包含 `window.innerWidth/Height`、`getBoundingClientRect()` 等**读布局**操作，频繁 render 时会触发**强制重排**风险。
* 解决：

  * 抽成 `useSmartModalPosition` hook，用 `useMemo` 缓存，依赖仅限 `isOpen / anchorRect / position / isAnimating`。
  * 通过 `ResizeObserver` / `window.resize` + `requestAnimationFrame` 节流更新。
  * **避免样式选择器查询**（见上）。

### P1：冲突检测每次时间改变立即触发

* 用户拖动时间时会频繁 setState -> 频繁 `onConflictCheck(start,end)`。
* 解决：**去抖**（150–300ms）后再检查，显著减少调用。

### P2：拖拽实现使用 `mousemove/mouseup`，每次 `mousedown` 动态加监听

* 功能OK，但可以更顺滑：

  * 用 **Pointer Events** + `setPointerCapture`，天然支持触控笔/触摸；
  * 在 `mousemove` 更新中用 `requestAnimationFrame` 合批，减少布局抖动。

### P3：下游子组件重复渲染

* `TimePicker` 的约束对象每次函数调用都会**新建对象**：
  `...getStartTimeConstraints()` / `...getEndTimeConstraints()`
* 解决：把约束结果**用 `useMemo` 固定引用**，或者改为传**原始值**（如 `min="09:00"`、`max="22:00"`），让子组件应对简单 string，而不是对象。

### P3：`moment` 体积大

* 如果全项目可控，建议切换 `dayjs` 或 `date-fns`（**中期改造项**）。此文件不一定要先动，但可列入技术债。

---

# 四、拆分/封装建议（落地结构）

建议把 Modal 拆成“外壳 + 表单分片 + 行为 hooks”，每块都可以 `memo`，减少重渲染：

```
AddEventModal/
├─ AddEventModal.tsx               // 外壳 + Header/Footer + 数据提交
├─ fields/
│  ├─ TypeField.tsx                // 类型选择（只读/可编辑）
│  ├─ LessonFields.tsx             // 课程专有字段（只读 & 编辑）
│  ├─ InvigilateFields.tsx         // 监考专有字段
│  ├─ RepeatField.tsx              // 重复设置（含次数）
│  └─ TimeRangeFields.tsx          // 开始/结束时间
├─ panels/
│  ├─ ConflictNotice.tsx
│  └─ DeleteConfirm.tsx
└─ hooks/
   ├─ useSmartModalPosition.ts     // 位置&动画
   ├─ useDraggable.ts              // 拖拽
   └─ useDebouncedConflict.ts      // 去抖冲突检测
```

> **收益**：局部状态只触发局部渲染；逻辑关注点单一，维护成本明显下降。

---

# 五、关键代码片段（可直接复制使用）

## 1) 去抖的冲突检测（替换现有 useEffect）

```tsx
// hooks/useDebouncedConflict.ts
import { useEffect, useState } from 'react';

export function useDebouncedConflict(
  enabled: boolean,
  start: Date | null,
  end: Date | null,
  onConflictCheck?: (s: Date, e: Date) => Array<{start: Date; end: Date}>,
  delay = 200
) {
  const [conflicts, setConflicts] = useState<Array<{start: Date; end: Date}>>([]);

  useEffect(() => {
    if (!enabled || !start || !end || !onConflictCheck) {
      setConflicts([]);
      return;
    }
    const id = setTimeout(() => {
      setConflicts(onConflictCheck(start, end));
    }, delay);
    return () => clearTimeout(id);
  }, [enabled, start?.getTime(), end?.getTime(), onConflictCheck, delay]);

  return conflicts;
}
```

在 `AddEventModal` 中这样用：

```tsx
const start = selectedDate ? moment(selectedDate).set({ hour: sh, minute: sm }).toDate() : null;
const end   = selectedDate ? moment(selectedDate).set({ hour: eh, minute: em }).toDate() : null;

const currentConflicts = useDebouncedConflict(
  Boolean(isOpen && selectedDate),
  start,
  end,
  onConflictCheck,
  250 // 轻微去抖
);
```

## 2) 智能定位 hook（避免每次 render 读 DOM）

```tsx
// hooks/useSmartModalPosition.ts
import { useEffect, useMemo, useState } from 'react';

interface UseSmartModalPositionOpts {
  isOpen: boolean;
  anchorRect?: DOMRect | null;         // 父层传入
  position?: { x: number; y: number; slideDirection?: 'left' | 'right' | 'center' };
  modalWidth: number;
  modalHeight: number;
  margin?: number;
  isAnimating: boolean;
}

export function useSmartModalPosition(opts: UseSmartModalPositionOpts) {
  const { isOpen, anchorRect, position, modalWidth, modalHeight, margin = 16, isAnimating } = opts;
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    if (!isOpen) return;
    let rAF: number | null = null;
    const onResize = () => {
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => setViewport({ w: window.innerWidth, h: window.innerHeight }));
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      if (rAF) cancelAnimationFrame(rAF);
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen]);

  return useMemo(() => {
    if (!isOpen) return { left: 0, top: 0, slide: 'center' as const };

    const screenWidth = viewport.w;
    const screenHeight = viewport.h;

    let left = Math.max(margin, (screenWidth - modalWidth) / 2);
    let top  = Math.max(margin, (screenHeight - modalHeight) / 2);
    let slide: 'left' | 'right' | 'center' = 'center';

    if (anchorRect) {
      const leftSpace = anchorRect.left;
      const rightSpace = screenWidth - anchorRect.right;

      if (rightSpace >= modalWidth + margin) {
        left = anchorRect.right + 20;
        slide = 'right';
      } else if (leftSpace >= modalWidth + margin) {
        left = anchorRect.left - modalWidth - 20;
        slide = 'left';
      }

      const selectionCenterY = anchorRect.top + anchorRect.height / 2;
      const idealTop = selectionCenterY - modalHeight / 2;
      top = Math.min(Math.max(margin, idealTop), screenHeight - modalHeight - margin);
    } else if (position) {
      const x = position.x - (window.pageXOffset || 0);
      const y = position.y - (window.pageYOffset || 0);
      left = Math.min(Math.max(margin, x), screenWidth - modalWidth - margin);
      top  = Math.min(Math.max(margin, y), screenHeight - modalHeight - margin);
      slide = position.slideDirection ?? 'center';
    }

    return { left, top, slide };
  }, [isOpen, viewport, anchorRect?.left, anchorRect?.top, anchorRect?.width, anchorRect?.height,
       position?.x, position?.y, position?.slideDirection, modalWidth, modalHeight, margin, isAnimating]);
}
```

> 父层在点击/选择时通过 `element.getBoundingClientRect()` 把 `anchorRect` 传进来，**杜绝样式匹配查询**。

## 3) 拖拽改 Pointer Events（更流畅）

```tsx
// hooks/useDraggable.ts
import { useRef, useState, useCallback } from 'react';

export function useDraggable() {
  const startRef = useRef<{x:number;y:number;ox:number;oy:number}|null>(null);
  const [offset, setOffset] = useState({x:0,y:0});
  const [dragging, setDragging] = useState(false);
  const rafRef = useRef<number | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
  }, [offset]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !startRef.current) return;
    const run = () => {
      const dx = e.clientX - startRef.current!.x;
      const dy = e.clientY - startRef.current!.y;
      setOffset({ x: startRef.current!.ox + dx, y: startRef.current!.oy + dy });
      rafRef.current = null;
    };
    if (!rafRef.current) rafRef.current = requestAnimationFrame(run);
  }, [dragging]);

  const onPointerUp = useCallback(() => {
    setDragging(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  return { offset, dragging, onPointerDown, onPointerMove, onPointerUp, setOffset };
}
```

使用：

```tsx
const drag = useDraggable();
// header:
<div
  className="... cursor-move"
  onPointerDown={drag.onPointerDown}
  onPointerMove={drag.onPointerMove}
  onPointerUp={drag.onPointerUp}
/>

// 叠加 transform:
const finalModalStyle = {
  ...modalStyle,
  transform: `translate(${drag.offset.x}px, ${drag.offset.y}px) ${modalStyle.transform ?? ''}`,
  transition: drag.dragging ? 'none' : modalStyle.transition
};
```

## 4) 约束 props 用 useMemo（减少子组件渲染抖动）

```tsx
const startConstraints = useMemo(() => ({
  minTime: DAY_START_TIME,
  maxTime: endTime < DAY_END_TIME ? endTime : DAY_END_TIME
}), [endTime]);

const endConstraints = useMemo(() => ({
  minTime: startTime > DAY_START_TIME ? startTime : DAY_START_TIME,
  maxTime: DAY_END_TIME
}), [startTime]);
```

然后：

```tsx
<TimePicker ... {...startConstraints} />
<TimePicker ... {...endConstraints} />
```

---

# 六、数据与表单状态简化（选做，但长期收益大）

当前组件有**很多 useState**，相互依赖。可以用 `useReducer` 把“表单状态”与“UI 状态（动画/拖拽/删除态）”分离：

* `formState`: `eventType|description|repeat|subject|campus|room|replaceRoom|topic|note|repeatNum|startTime|endTime`
* `uiState`: `isAnimating|shouldShow|showDeleteMode|deleteRepeatNum|drag`

这样可以让**每次变更只影响某个子树**，减少重复渲染。

---

# 七、类型补全建议（替换 any）

```ts
interface RoomMap { [id: string]: string }
interface CampusMap { [id: string]: string }
interface TopicMap { [id: string]: string }
interface StaffClassMap { [id: string]: string }

interface ScheduleData {
  class_topics?: TopicMap;
  campus_info?: CampusMap;
  room_info?: RoomMap;
  staff_class?: StaffClassMap;
}

interface InitialEvent {
  id: string;
  type: 'lesson'|'unavailable'|'invigilate';
  start: Date | string; // 若后端是字符串，进来后用 new Date()
  end: Date | string;
  description?: string;
  repeat?: 'none'|'weekly';
  subject?: string;
  subject_name?: string;
  campus?: string;
  room_id?: number;
  pickRoom?: string;
  replaceRoomWhenBooked?: boolean;
  topic_id?: string;
  note?: string;
  repeat_num?: number;
  title?: string;
  class_id?: string|number;

  // 只读展示
  teacherName?: string;
  students?: string;
  student_name?: string;
}
```

---

# 八、提交逻辑的小建议

* `handleSubmit` 里组装 `start/end` 很好，但注意：

  * `selectedCampus`/`selectedRoom` 在不同 `eventType` 下是否需要发送？（可在提交前按类型**剔除无关字段**，减轻后端分支）
  * 如果 `repeat === 'none'`，可以不传 `repeat_num`。

---

# 九、最终“修改方案清单”（可 copy 到任务看板）

**短期（当天可完成）**

* [ ] 移除未使用 props：`onRepeatChange`, `onRefreshData`, `staffId`
* [ ] 常量 `DAY_START_TIME/END` 下沉组件外
* [ ] 修复“重复选择框”无选项的问题
* [ ] 取消教师信息硬编码（改从 props/initialEvent 读取；读不到则不传）
* [ ] 将基于 `style` 的 DOM 查询改为由父层传 `anchorRect`（过渡期可保留旧逻辑，但尽快切）
* [ ] 冲突检查加入 200–300ms 去抖
* [ ] `TimePicker` 约束用 `useMemo` 固定引用

**中期（1～2个迭代）**

* [ ] 拆分为 `fields/*`、`panels/*`、`hooks/*`（见结构图）
* [ ] 拖拽切换到 Pointer Events + rAF
* [ ] `calculateModalProps` 抽成 `useSmartModalPosition`，并监听窗口 `resize`
* [ ] 强化 `initialEvent`、`scheduleData` 的 TypeScript 类型
* [ ] 视情况把 `moment` 迁移到 `dayjs`（或全项目统一）

**可选增强**

* [ ] Modal 增加 `role="dialog"`、`aria-modal="true"`、`aria-labelledby`
* [ ] Footer 按钮区拆出组件，减少 if-else 嵌套
* [ ] 提交前按类型剔除无关字段（payload 更干净）

---

如果你愿意，我可以按上面的结构帮你**直接出一版拆分后的代码骨架**（含三个 hooks 和五个 fields 组件），你把现有逻辑搬过去就行。
