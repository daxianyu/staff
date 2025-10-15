'use client';
import React from 'react';
import type { ScheduleEvent } from '../hooks/useScheduleData';

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
    return (
      <div className="custom-event">
        <div className="event-line">{event.title}</div>
        {event.room_name && <div className="event-line">教室：{event.room_name}</div>}
        {event.teacher && <div className="event-line">教师：{event.teacher}</div>}
        {event.students && (
          <div className="event-line">
            学生：{event.students.length > 8 ? `${event.students.slice(0, 8)}..等（共${event.student_ids?.length || 0}人）` : event.students}
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