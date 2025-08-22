// /schedule/strategies/lesson.tsx
import * as React from 'react';
import { EventTypeStrategy } from './types';

type Form = {
  pickRoom?: string | number;
  repeat_num?: number;
};

const toSec = (d: Date) => Math.floor(d.getTime() / 1000);

export const LessonStrategy: EventTypeStrategy<Form> = {
  key: 'lesson',
  label: '课程',
  allowRepeat: true,

  init(ctx) {
    // 初始化表单：从 initialEvent 带出 room_id 等
    return {
      pickRoom: ctx.initialEvent?.room_id,
      repeat_num: 1,
    };
  },

  render({ form, setForm, readOnly, scheduleData }) {
    const rooms: Record<string, string> = scheduleData?.room_info || {};
    const roomId = form.pickRoom != null ? String(form.pickRoom) : '';
    const roomLabel = roomId ? rooms[roomId] ?? '—' : '—';

    return (
      <>
        <label className="block text-xs font-medium text-gray-700 mb-1">教室</label>
        {readOnly ? (
          <p className="w-full px-3 py-1.5 text-sm bg-gray-50 border rounded">{roomLabel}</p>
        ) : (
          <select
            className="w-full px-3 py-1.5 text-sm border rounded"
            value={roomId}
            onChange={(e) => setForm({ pickRoom: e.target.value })}
          >
            <option value="">请选择教室</option>
            {Object.entries(rooms).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        )}

        {!readOnly && (
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">涉及周数</label>
            <input
              type="number"
              min={1}
              max={52}
              className="w-full px-3 py-1.5 text-sm border rounded"
              value={form.repeat_num ?? 1}
              onChange={(e) => setForm({ repeat_num: Number(e.target.value) || 1 })}
            />
          </div>
        )}
      </>
    );
  },

  async onSave(form, ctx, api) {
    // 这里给出“编辑课程”的实现；新增课程可按需要再补
    if (ctx.mode !== 'edit' || !ctx.initialEvent?.id) return;

    const r = await api.editStaffLesson(api.staffId, {
      lesson_id: String(ctx.initialEvent.id),
      subject_id: ctx.initialEvent.subject_id ?? undefined, // 若允许改科目可从 form 带
      start_time: toSec(ctx.start),
      end_time: toSec(ctx.end),
      room_id: form.pickRoom,
      repeat_num: form.repeat_num ?? 1,
    });

    if (r.status !== 0) throw new Error(r.message || '保存失败');
  },

  async onDelete(current, _ctx, api) {
    const r = await api.deleteStaffLesson(api.staffId, {
      lesson_ids: [String(current.id)],
      repeat_num: current.repeat_num ?? 1,
    });
    if (r.status !== 0) throw new Error(r.message || '删除失败');
  },
};
