# Radix UI 组件使用指南

基于 Radix UI 构建的 Headless 组件库，使用 Tailwind CSS 进行样式定制。

## 特点

✅ **无预设样式** - 完全可定制  
✅ **无障碍支持** - 符合 WAI-ARIA 标准  
✅ **TypeScript 支持** - 完整类型定义  
✅ **Tailwind CSS** - 与项目技术栈完美匹配

## 组件列表

### 1. TimePicker - 时间选择器

```tsx
import { TimePicker } from '@/components';

function MyComponent() {
  const [time, setTime] = useState('09:00');

  return (
    <TimePicker
      label="开始时间"
      value={time}
      onChange={setTime}
      placeholder="选择时间"
    />
  );
}
```

**属性:**
- `value: string` - 当前时间值 (HH:mm 格式)
- `onChange: (value: string) => void` - 时间变化回调
- `label?: string` - 标签文本
- `placeholder?: string` - 占位符文本
- `minTime?: string` - 最早可选时间 (HH:mm 格式)
- `maxTime?: string` - 最晚可选时间 (HH:mm 格式)
- `disabled?: boolean` - 是否禁用

**时间限制示例:**
```tsx
// 限制只能选择工作时间
<TimePicker
  label="开始时间"
  value={startTime}
  onChange={setStartTime}
  minTime="09:00"
  maxTime="18:00"
/>

// 结束时间不能早于开始时间
<TimePicker
  label="结束时间"
  value={endTime}
  onChange={setEndTime}
  minTime={startTime}
  maxTime="22:00"
/>
```

### 2. Button - 增强按钮

```tsx
import { Button } from '@/components';
import { PlusIcon } from '@heroicons/react/24/outline';

function MyComponent() {
  return (
    <>
      {/* 基础按钮 */}
      <Button>点击我</Button>

      {/* 带图标 */}
      <Button icon={<PlusIcon className="h-4 w-4" />}>
        添加
      </Button>

      {/* 加载状态 */}
      <Button loading>提交中...</Button>

      {/* 不同样式 */}
      <Button variant="secondary">次要按钮</Button>
      <Button variant="outline">轮廓按钮</Button>
      <Button variant="danger">危险按钮</Button>

      {/* 全宽 */}
      <Button fullWidth>全宽按钮</Button>
    </>
  );
}
```

**属性:**
- `variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'`
- `size?: 'sm' | 'md' | 'lg'`
- `loading?: boolean` - 显示加载状态
- `icon?: React.ReactNode` - 图标
- `iconPosition?: 'left' | 'right'` - 图标位置
- `fullWidth?: boolean` - 全宽显示

### 3. DropdownMenu - 下拉菜单

```tsx
import { DropdownMenu } from '@/components';

function MyComponent() {
  const menuItems = [
    { label: '编辑', value: 'edit', onClick: () => console.log('编辑') },
    { label: '复制', value: 'copy', onClick: () => console.log('复制') },
    { label: '删除', value: 'delete', onClick: () => console.log('删除'), danger: true },
    { label: '禁用项', value: 'disabled', disabled: true }
  ];

  return (
    <DropdownMenu
      trigger={<span>更多操作</span>}
      items={menuItems}
      className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
    />
  );
}
```

**属性:**
- `trigger: React.ReactNode` - 触发元素
- `items: MenuItem[]` - 菜单项数组
- `className?: string` - 触发按钮的样式类

### 4. Switch - 开关

```tsx
import { Switch } from '@/components';

function MyComponent() {
  const [enabled, setEnabled] = useState(false);

  return (
    <>
      {/* 基础开关 */}
      <Switch 
        checked={enabled} 
        onCheckedChange={setEnabled} 
      />

      {/* 带标签 */}
      <Switch
        checked={enabled}
        onCheckedChange={setEnabled}
        label="启用通知"
        description="接收系统通知和提醒"
      />

      {/* 不同尺寸 */}
      <Switch size="sm" checked={enabled} onCheckedChange={setEnabled} />
      <Switch size="lg" checked={enabled} onCheckedChange={setEnabled} />
    </>
  );
}
```

**属性:**
- `checked: boolean` - 开关状态
- `onCheckedChange: (checked: boolean) => void` - 状态变化回调
- `label?: string` - 标签文本
- `description?: string` - 描述文本
- `disabled?: boolean` - 禁用状态
- `size?: 'sm' | 'md' | 'lg'` - 尺寸

## 在 AddEventModal 中的应用

现已将原生的 `<input type="time">` 替换为自定义的 `TimePicker` 组件：

```tsx
// 原来的代码
<input
  type="time"
  value={startTime}
  onChange={(e) => setStartTime(e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
/>

// 现在的代码
<TimePicker
  label="开始时间"
  value={startTime}
  onChange={setStartTime}
/>
```

## 优势对比

| 特性 | 原生 HTML | Radix UI 组件 |
|------|-----------|---------------|
| 样式定制 | 受限 | ✅ 完全定制 |
| 无障碍 | 基础支持 | ✅ 完整支持 |
| 交互体验 | 简单 | ✅ 丰富交互 |
| 跨浏览器 | 有差异 | ✅ 一致体验 |
| 移动端 | 一般 | ✅ 优化支持 |

## 扩展建议

可根据需要继续添加更多 Radix UI 组件：

```bash
# 其他有用的组件
npm install @radix-ui/react-toast @radix-ui/react-checkbox @radix-ui/react-radio-group @radix-ui/react-progress @radix-ui/react-slider
``` 