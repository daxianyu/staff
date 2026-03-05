'use client';
import React from 'react';
import type { ScheduleEvent } from '../hooks/useScheduleData';
import { openUrlWithFallback } from '@/utils/openUrlWithFallback';

export const EventItem = React.memo(({ event }: { event: ScheduleEvent }) => {
  if (event.type === 'invigilate') {
    return (
      <div className="custom-event">
        <div className="event-line">监考：{event.subject_name || '未知科目'}</div>
        {event.teacher && <div className="event-line">教师：{event.teacher}</div>}
        {event.note && <div className="event-line">备注：{event.note}</div>}
      </div>
    );
  }

  if (event.type === 'lesson') {
    const studentsStr = event.students || '';
    const ids = event.student_ids || [];
    const names = studentsStr ? studentsStr.split(/[,，、\s]+/).filter(Boolean) : [];
    const studentItems = names.length >= ids.length
      ? names.map((name, i) => ({ name: name.trim(), id: ids[i] }))
      : ids.map((id, i) => ({ name: names[i]?.trim() || `学生 #${id}`, id }));

    return (
      <div className="custom-event">
        <div className="event-line">{event.title}</div>
        {event.room_name && <div className="event-line">教室：{event.room_name}</div>}
        {event.teacher && <div className="event-line">教师：{event.teacher}</div>}
        {(studentItems.length > 0 || studentsStr) && (
          <div className="event-line">
            学生：
            {studentItems.length > 0 ? (
              <>
                {studentItems.map(({ name, id }, i) => (
                  <React.Fragment key={`${id}-${i}`}>
                    {i > 0 && '、'}
                    {id ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openUrlWithFallback(`/students/schedule?studentId=${id}`);
                        }}
                        className="underline hover:opacity-90 cursor-pointer text-inherit bg-transparent border-none p-0"
                      >
                        {name}
                      </button>
                    ) : (
                      <span>{name}</span>
                    )}
                  </React.Fragment>
                ))}
              </>
            ) : (
              studentsStr
            )}
          </div>
        )}
      </div>
    );
  }

  if (event.type === 'unavailable') {
    return <div className="custom-event">不可用</div>;
  }

  // selected / 默认
  return <div className="custom-event">{event.title}</div>;
});