'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';

export type EventType = 'lesson' | 'unavailable' | 'invigilate' | 'selected';

export interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: EventType;
  // 课程
  subject_id?: number;
  room_id?: number;
  class_id?: number;
  room_name?: string;
  students?: string;
  student_ids?: number[];
  teacher?: string;
  // 监考
  topic_id?: string;
  note?: string;
  subject_name?: string; // 监考科目 / 课程名冗余
}

export interface StaffScheduleData {
  lessons: any[];
  special_day: any[];
  staff_class: Record<string, string>;
  students: Record<string, string>;
  campus_info: Record<string, string>;
  room_info: Record<string, string>;
  unavailable: Array<{ start_time: number; end_time: number }>; // 秒
  invigilate: Array<{ id: number|string; start_time: number; end_time: number; topic_id: string; note?: string }>; // 秒
  class_topics: Record<string, string>;
}

// 合并重叠时间段（Date）
function mergeRanges(ranges: Array<{ start: Date; end: Date }>) {
  if (ranges.length <= 1) return ranges;
  const sorted = [...ranges].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Array<{ start: Date; end: Date }> = [];
  let cur = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const nxt = sorted[i];
    if (cur.end >= nxt.start) {
      cur = { start: cur.start, end: new Date(Math.max(cur.end.getTime(), nxt.end.getTime())) };
    } else {
      merged.push(cur);
      cur = nxt;
    }
  }
  merged.push(cur);
  return merged;
}

export function useScheduleData(params: {
  staffId: string;
  date: Date;
  view: 'day' | 'week';
  getStaffSchedule: (staffId: string, weekNum: string) => Promise<{ data?: StaffScheduleData } | any>;
  classTopicsRef?: React.MutableRefObject<Record<string, string> | null>;
  staffName?: string; // 可选：用于 invigilate 渲染
}) {
  const { staffId, date, view, getStaffSchedule, classTopicsRef, staffName } = params;
  const [raw, setRaw] = useState<StaffScheduleData | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);

  // week num（从 1970-01-01 + 偏移到周一）
  const weekNum = useMemo(() => {
    const startEpoch = new Date(1970, 0, 1);
    const diff = date.getTime() - startEpoch.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const adjustedDays = days - 4; // align Monday
    return String(adjustedDays < 0 ? 0 : Math.floor(adjustedDays / 7));
  }, [date]);

  // 拉取
  useEffect(() => {
    let aborted = false;
    if (!staffId || view !== 'week') return;
    (async () => {
      const resp = await getStaffSchedule(staffId, weekNum);
      if (!aborted && resp?.data) setRaw(resp.data);
    })();
    return () => { aborted = true; };
  }, [staffId, weekNum, view, getStaffSchedule]);

  // 映射
  useEffect(() => {
    if (!raw) {
      setEvents([]);
      return;
    }

    // 供外部快速访问 class_topics（可选）
    classTopicsRef && (classTopicsRef.current = raw.class_topics || null);

    const list: ScheduleEvent[] = [];

    // 1) 课程
    if (Array.isArray(raw.lessons)) {
      for (const l of raw.lessons) {
        const id = l.lesson_id != null ? String(l.lesson_id) : `${l.start_time}_${l.end_time}_${l.room_id ?? 'x'}`;
        list.push({
          id,
          title: l.subject_name || '课程',
          start: new Date((l.start_time ?? 0) * 1000),
          end: new Date((l.end_time ?? 0) * 1000),
          type: 'lesson',
          subject_id: l.subject_id,
          room_id: l.room_id,
          class_id: l.class_id,
          students: l.students,
          student_ids: l.student_ids,
          room_name: l.room_name || '',
          teacher: l.teacher || '',
          subject_name: l.subject_name,
        });
      }
    }

    // 2) 监考
    if (Array.isArray(raw.invigilate)) {
      for (const v of raw.invigilate) {
        const id = `invigilate_${v.id ?? `${v.start_time}_${v.topic_id}`}`;
        list.push({
          id,
          title: '监考',
          start: new Date((v.start_time ?? 0) * 1000),
          end: new Date((v.end_time ?? 0) * 1000),
          type: 'invigilate',
          topic_id: v.topic_id || '',
          note: v.note || '',
          teacher: staffName || '',
          subject_name: raw.class_topics?.[v.topic_id] || '未知科目',
        });
      }
    }

    // 3) 不可用（映射为事件）—— 先合并，再入列
    if (Array.isArray(raw.unavailable)) {
      const ranges = raw.unavailable.map(u => ({ start: new Date((u.start_time ?? 0) * 1000), end: new Date((u.end_time ?? 0) * 1000) }));
      const merged = mergeRanges(ranges);
      for (const r of merged) {
        const id = `unavail_${r.start.getTime()}_${r.end.getTime()}`;
        list.push({ id, title: '不可用', start: r.start, end: r.end, type: 'unavailable' });
      }
    }

    setEvents(list);
  }, [raw, classTopicsRef, staffName]);

  // 暴露的刷新函数
  const refresh = useCallback(async () => {
    if (!staffId || view !== 'week') return;
    const resp = await getStaffSchedule(staffId, weekNum);
    if (resp?.data) setRaw(resp.data);
  }, [staffId, view, weekNum, getStaffSchedule]);

  // 不可用原始范围（Date）给冲突检查使用
  const unavailableRanges = useMemo(() => {
    if (!raw?.unavailable) return [] as Array<{ start: Date; end: Date }>;
    return mergeRanges(raw.unavailable.map(u => ({ start: new Date(u.start_time * 1000), end: new Date(u.end_time * 1000) })));
  }, [raw]);

  return { raw, events, refresh, unavailableRanges };
}
