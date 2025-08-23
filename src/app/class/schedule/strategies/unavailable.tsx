// /schedule/strategies/unavailable.ts
import { EventTypeStrategy } from './types';

type Form = { repeat: 'none' | 'weekly' };

const toSec = (d: Date) => Math.floor(d.getTime() / 1000);

export const UnavailableStrategy: EventTypeStrategy<Form> = {
  key: 'unavailable',
  label: '不可用时段',
  allowRepeat: true,

  init(_ctx) {
    return { repeat: 'none' };
  },

  render({ form, setForm, readOnly, scheduleData, ctx }) {
    if (readOnly) return null;
    return (
      <div className="mt-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">每周重复</label>
        <select
          className="w-full px-3 py-1.5 text-sm border rounded"
          value={form.repeat}
          onChange={(e) => setForm({ repeat: e.target.value as Form['repeat'] })}
        >
          <option value="none">不重复</option>
          <option value="weekly">每周</option>
        </select>
      </div>
    );
  },

  async onSave(form, ctx, api) {
    // 只有在员工课表模式下才支持不可用时段
    if (!api.updateStaffUnavailable || !api.staffId || !api.getWeekNum) {
      throw new Error('当前模式不支持不可用时段功能');
    }

    // 简化：weekly 先按单次处理；如果需要生成多天段，可在此展开
    const { start, end, unavailableRangesSec = [] } = ctx;
    const addOne = [{ start_time: toSec(start), end_time: toSec(end) }];

    // 全量：现有 + 新增
    const all = [...unavailableRangesSec, ...addOne];
    const r = await api.updateStaffUnavailable(api.staffId, {
      week_num: api.getWeekNum(api.date),
      event_type: 1,
      time_list: all,
    });
    if (r.status !== 0) throw new Error(r.message || '保存失败');
  },

  async onDelete(current, ctx, api) {
    if (!api.updateStaffUnavailable || !api.staffId || !api.getWeekNum) {
      throw new Error('当前模式不支持删除不可用时段');
    }

    // 全量：现有 - 当前
    const origS = Number(String(ctx.initialEvent?.start?.getTime?.() ?? 0) ? Math.floor(ctx.initialEvent.start.getTime() / 1000) : 0);
    const origE = Number(String(ctx.initialEvent?.end?.getTime?.() ?? 0) ? Math.floor(ctx.initialEvent.end.getTime() / 1000) : 0);

    const kept = (ctx.unavailableRangesSec || []).filter(t => !(t.start_time === origS && t.end_time === origE));
    const r = await api.updateStaffUnavailable(api.staffId, {
      week_num: api.getWeekNum(api.date),
      event_type: 1,
      time_list: kept,
    });
    if (r.status !== 0) throw new Error(r.message || '删除失败');
  },
};
