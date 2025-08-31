// /schedule/strategies/invigilate.tsx
import { EventTypeStrategy, StrategyCtx, ApiBundle } from './types';

type Form = { topic_id: string; note: string };

const toSec = (d: Date) => Math.floor(d.getTime() / 1000);

export const InvigilateStrategy: EventTypeStrategy<Form> = {
  key: 'invigilate',
  label: '监考',
  allowRepeat: false,

  init(ctx) {
    const topicDefault = Object.keys(ctx.scheduleData?.class_topics || {})[0] || '';
    return {
      topic_id: ctx.initialEvent?.topic_id || topicDefault,
      note: ctx.initialEvent?.note || '',
    };
  },

  render({ form, setForm, readOnly, scheduleData, ctx }) {
    const topics: Record<string, string> = scheduleData?.class_topics || {};
    return (
      <>
        <label className="block text-xs font-medium text-gray-700 mb-1">监考科目</label>
        {readOnly ? (
          <p className="w-full px-3 py-1.5 text-sm bg-gray-50 border rounded">
            {topics[form.topic_id] || form.topic_id || '—'}
          </p>
        ) : (
          <select
            className="w-full px-3 py-1.5 text-sm border rounded"
            value={form.topic_id}
            onChange={(e) => setForm({ topic_id: e.target.value })}
          >
            {Object.entries(topics).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        )}

        <label className="block text-xs font-medium text-gray-700 mt-2 mb-1">备注</label>
        {readOnly ? (
          <p className="w-full px-3 py-1.5 text-sm bg-gray-50 border rounded">{form.note || '—'}</p>
        ) : (
          <textarea
            className="w-full px-3 py-1.5 text-sm border rounded resize-none"
            rows={2}
            value={form.note}
            onChange={(e) => setForm({ note: e.target.value })}
          />
        )}
      </>
    );
  },

  validate(form) {
    const errs: string[] = [];
    if (!form.topic_id) errs.push('请选择监考科目');
    return errs;
  },

  async onSave(form, ctx, api) {
    // 只有在员工课表模式下才支持监考
    if (!api.updateStaffInvigilate || !api.addStaffInvigilate || !api.staffId) {
      throw new Error('当前模式不支持监考功能');
    }

    const { start, end, mode, initialEvent } = ctx;
    const start_time = toSec(start);
    const end_time = toSec(end);

    if (mode === 'edit' && initialEvent?.id) {
      // 更新
      const record_id = String(initialEvent.id).replace('invigilate_', '');
      const r = await api.updateStaffInvigilate({
        record_id,
        staff_id: api.staffId,
        start_time,
        end_time,
        topic_id: form.topic_id,
        note: form.note || '',
      });
      if (r.status !== 0) throw new Error(r.message || '更新失败');
    } else {
      // 新增
      const r = await api.addStaffInvigilate({
        staff_id: api.staffId,
        start_time,
        end_time,
        topic_id: form.topic_id,
        note: form.note || '',
      });
      if (r.status !== 0) throw new Error(r.message || '保存失败');
    }
  },

  async onDelete(current, _ctx, api) {
    if (!api.deleteStaffInvigilate) {
      throw new Error('当前模式不支持删除监考');
    }
    // 监考删除不需要 repeat_num
    const record_id = String(current.id).replace('invigilate_', '');
    const r = await api.deleteStaffInvigilate({ record_id });
    if (r.status !== 0) throw new Error(r.message || '删除失败');
  },
};
