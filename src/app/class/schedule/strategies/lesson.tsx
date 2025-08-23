// /schedule/strategies/lesson.tsx
import * as React from 'react';
import { EventTypeStrategy } from './types';

type Form = {
  pickRoom?: string | number;
  repeat_num?: number;
  subject_id?: number;
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
      subject_id: ctx.initialEvent?.subject_id,
    };
  },

  render({ form, setForm, readOnly, scheduleData, ctx }) {
    // 支持班级课表的房间信息
    const rooms = scheduleData?.all_rooms || scheduleData?.room_info || {};
    const roomsArray = Array.isArray(rooms) ? rooms : Object.entries(rooms).map(([id, name]) => ({ id: Number(id), name }));
    
    const roomId = form.pickRoom != null ? String(form.pickRoom) : '';
    const roomLabel = roomId ? (roomsArray.find(r => String(r.id) === roomId)?.name || '—') : '—';

    // 支持班级课表的科目信息
    const subjects = scheduleData?.class_subjects || [];
    
    // 获取房间占用信息
    const roomTaken = scheduleData?.room_taken || {};
    
    // 时间冲突检查函数
    const checkRoomConflict = (roomId: number, startTime: Date, endTime: Date) => {
      const roomOccupied = roomTaken[roomId] || [];
      const startSec = Math.floor(startTime.getTime() / 1000);
      const endSec = Math.floor(endTime.getTime() / 1000);
      
      // 在编辑模式下，需要排除当前课程自身
      if (ctx?.mode === 'edit' && ctx?.initialEvent?.id) {
        const currentLessonId = String(ctx.initialEvent.id).replace('lesson_', '');
        const currentLesson = scheduleData?.lessons?.find((l: any) => l.id === parseInt(currentLessonId));
        
        if (currentLesson) {
          // 过滤掉当前课程的时间段
          const otherOccupied = roomOccupied.filter(([occupiedStart, occupiedEnd]: [number, number]) => {
            return !(occupiedStart === currentLesson.start_time && occupiedEnd === currentLesson.end_time);
          });
          
          return otherOccupied.some(([occupiedStart, occupiedEnd]: [number, number]) => {
            return startSec < occupiedEnd && endSec > occupiedStart;
          });
        } else {
          // 如果找不到当前课程，使用时间匹配的方式
          return roomOccupied.some(([occupiedStart, occupiedEnd]: [number, number]) => {
            if (occupiedStart === startSec && occupiedEnd === endSec) {
              return false; // 跳过完全匹配的时间段
            }
            return startSec < occupiedEnd && endSec > occupiedStart;
          });
        }
      } else {
        // 新增模式：检查所有冲突
        return roomOccupied.some(([occupiedStart, occupiedEnd]: [number, number]) => {
          return startSec < occupiedEnd && endSec > occupiedStart;
        });
      }
    };
    
    // 为每个房间检查是否有冲突
    const roomsWithConflict = roomsArray.map(room => {
      let hasConflict = false;
      if (ctx?.start && ctx?.end && room.id) {
        hasConflict = checkRoomConflict(room.id, ctx.start, ctx.end);
      }
      return { ...room, hasConflict };
    });

    return (
      <>
        {/* 科目选择（仅在新增模式或班级课表中显示） */}
        {!readOnly && subjects.length > 0 && (
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">科目</label>
            <select
              className="w-full px-3 py-1.5 text-sm border rounded"
              value={form.subject_id || ''}
              onChange={(e) => setForm({ subject_id: Number(e.target.value) || undefined })}
            >
              <option value="">请选择科目</option>
              {subjects.map((subject: any) => (
                <option key={subject.id} value={subject.id}>
                  {subject.topic_name} - {subject.teacher_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="block text-xs font-medium text-gray-700 mb-1">教室</label>
        {readOnly ? (
          <p className="w-full px-3 py-1.5 text-sm bg-gray-50 border rounded">{roomLabel}</p>
        ) : (
          <>
            <select
              className="w-full px-3 py-1.5 text-sm border rounded"
              value={roomId}
              onChange={(e) => setForm({ pickRoom: Number(e.target.value) || e.target.value })}
            >
              <option value="">请选择教室</option>
              {roomsWithConflict.map((room: any) => (
                <option 
                  key={room.id} 
                  value={room.id}
                  style={{ 
                    color: room.hasConflict ? '#dc2626' : 'inherit',
                    backgroundColor: room.hasConflict ? '#fef2f2' : 'inherit'
                  }}
                >
                  {room.name}{room.hasConflict ? ' (时间冲突)' : ''}
                </option>
              ))}
            </select>
            {/* 显示选中房间的冲突警告 */}
            {roomId && roomsWithConflict.find(r => String(r.id) === roomId)?.hasConflict && (
              <div className="mt-1 text-xs text-red-600 flex items-center">
                <span className="mr-1">⚠️</span>
                <span>该教室在所选时间段已被占用</span>
              </div>
            )}
          </>
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

  validate(form, ctx) {
    const errs: string[] = [];
    
    // 检查科目选择（班级课表模式）
    if (ctx.scheduleData?.class_subjects?.length > 0 && !form.subject_id) {
      errs.push('请选择科目');
    }
    
    // 检查房间冲突
    if (form.pickRoom && ctx.start && ctx.end && ctx.scheduleData?.room_taken) {
      const roomTaken = ctx.scheduleData.room_taken;
      const roomOccupied = roomTaken[Number(form.pickRoom)] || [];
      const startSec = Math.floor(ctx.start.getTime() / 1000);
      const endSec = Math.floor(ctx.end.getTime() / 1000);
      
      // 在编辑模式下，需要排除当前课程自身
      let hasConflict = false;
      if (ctx.mode === 'edit' && ctx.initialEvent?.id) {
        // 编辑模式：从room_taken中排除当前课程的时间段
        const currentLessonId = String(ctx.initialEvent.id).replace('lesson_', '');
        const currentLesson = ctx.scheduleData?.lessons?.find((l: any) => l.id === parseInt(currentLessonId));
        
        if (currentLesson) {
          // 过滤掉当前课程的时间段
          const otherOccupied = roomOccupied.filter(([occupiedStart, occupiedEnd]: [number, number]) => {
            // 如果时间段匹配当前课程，则排除
            return !(occupiedStart === currentLesson.start_time && occupiedEnd === currentLesson.end_time);
          });
          
          hasConflict = otherOccupied.some(([occupiedStart, occupiedEnd]: [number, number]) => {
            return startSec < occupiedEnd && endSec > occupiedStart;
          });
        } else {
          // 如果找不到当前课程，使用时间匹配的方式
          hasConflict = roomOccupied.some(([occupiedStart, occupiedEnd]: [number, number]) => {
            if (occupiedStart === startSec && occupiedEnd === endSec) {
              return false; // 跳过完全匹配的时间段
            }
            return startSec < occupiedEnd && endSec > occupiedStart;
          });
        }
      } else {
        // 新增模式：检查所有冲突
        hasConflict = roomOccupied.some(([occupiedStart, occupiedEnd]: [number, number]) => {
          return startSec < occupiedEnd && endSec > occupiedStart;
        });
      }
      
      if (hasConflict) {
        const roomName = ctx.scheduleData?.all_rooms?.find((r: any) => r.id === Number(form.pickRoom))?.name || '选中的教室';
        errs.push(`${roomName}在所选时间段已被占用，请选择其他教室或时间`);
      }
    }
    
    return errs;
  },

  async onSave(form, ctx, api) {
    // 根据可用的API判断是班级课表还是员工课表
    if (api.addClassLesson && api.editClassLesson) {
      // 班级课表模式
      if (ctx.mode === 'add') {
        // 验证已在UI层处理，这里不再检查
        if (!api.classId) throw new Error('缺少班级ID');
        const r = await api.addClassLesson({
          class_id: api.classId,
          subject_id: form.subject_id,
          start_time: toSec(ctx.start),
          end_time: toSec(ctx.end),
          room_id: Number(form.pickRoom) || -1,
          repeat_num: form.repeat_num ?? 1,
        });

        // 检查是否有详细的错误信息
        if (r.code !== 200) {
          if (r.data && typeof r.data === 'object' &&
              ('teacher_error' in r.data || 'student_error' in r.data || 'room_error' in r.data)) {
            // 将错误信息作为特殊格式的错误抛出
            const error = new Error(JSON.stringify(r.data));
            (error as any).data = r.data;
            throw error;
          } else {
            throw new Error(r.message || '新增失败');
          }
        }
      } else if (ctx.mode === 'edit' && ctx.initialEvent?.id) {
        const lessonId = parseInt(String(ctx.initialEvent.id).replace('lesson_', ''));
        const r = await api.editClassLesson({
          record_id: lessonId,
          start_time: toSec(ctx.start),
          end_time: toSec(ctx.end),
          room_id: Number(form.pickRoom) || -1,
          repeat_num: form.repeat_num ?? 1,
        });

        // 检查是否有详细的错误信息
        if (r.code !== 200) {
          if (r.data && typeof r.data === 'object' &&
              ('teacher_error' in r.data || 'student_error' in r.data || 'room_error' in r.data)) {
            // 将错误信息作为特殊格式的错误抛出
            const error = new Error(JSON.stringify(r.data));
            (error as any).data = r.data;
            throw error;
          } else {
            throw new Error(r.message || '编辑失败');
          }
        }
      }
    } else if (api.editStaffLesson && api.staffId) {
      // 员工课表模式（兼容旧版本）
      if (ctx.mode !== 'edit' || !ctx.initialEvent?.id) return;
      const r = await api.editStaffLesson(api.staffId, {
        lesson_id: String(ctx.initialEvent.id),
        subject_id: ctx.initialEvent.subject_id ?? undefined,
        start_time: toSec(ctx.start),
        end_time: toSec(ctx.end),
        room_id: String(form.pickRoom),
        repeat_num: form.repeat_num ?? 1,
      });
      if (r.status !== 0) throw new Error(r.message || '保存失败');
    }
  },

  async onDelete(current, _ctx, api) {
    // 根据可用的API判断是班级课表还是员工课表
    if (api.deleteClassLesson) {
      // 班级课表模式
      const lessonId = parseInt(String(current.id).replace('lesson_', ''));
      const r = await api.deleteClassLesson({
        record_id: lessonId,
        repeat_num: current.repeat_num ?? 1,
      });
      if (r.code !== 200) throw new Error(r.message || '删除失败');
    } else if (api.deleteStaffLesson && api.staffId) {
      // 员工课表模式（兼容旧版本）
      const r = await api.deleteStaffLesson(api.staffId, {
        lesson_ids: [String(current.id)],
        repeat_num: current.repeat_num ?? 1,
      });
      if (r.status !== 0) throw new Error(r.message || '删除失败');
    }
  },
};
