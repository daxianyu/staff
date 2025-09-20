/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeader } from '../apiClient';

// ================= 学生课表（供教师端查看） =================
export interface StudentLessonInfo {
  lesson_id: number;
  start_time: number; // 秒级时间戳
  end_time: number;   // 秒级时间戳
  teacher: string;
  subject_name: string;
  room_name: string;
  topic_name: string;
  students: string;   // 逗号分隔
  class_id: number;
  class_name: string;
}

export interface StudentScheduleData {
  student_exam: any[];
  special_day: any[];
  lessons: StudentLessonInfo[];
}

export interface StudentScheduleResponse {
  status: number;
  message: string;
  data: StudentScheduleData;
}

export const getStudentSchedule = async (studentId: number | string, weekNum: number): Promise<StudentScheduleResponse> => {
  try {
    const url = `/api/students/schedule/${studentId}/${weekNum}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch(url, { method: 'GET', headers });
    const data = await response.json();
    return data as StudentScheduleResponse;
  } catch (error) {
    console.error('获取学生课表失败:', error);
    return { status: -1, message: '获取学生课表失败', data: { student_exam: [], special_day: [], lessons: [] } } as StudentScheduleResponse;
  }
};

// 学生课程时间表（按时间戳键）
export interface StudentLessonTableItem {
  room_name: string;
  room_id: number;
  lesson_id: number;
  subject_id: number;
  subject_name: string;
  start_time: number; // 秒级时间戳
  topic_id: number;
  end_time: number;   // 秒级时间戳
  teacher: string;
  week_num: number;
}

export interface StudentLessonTableResponse {
  status: number;
  message: string;
  data: Record<string, StudentLessonTableItem>;
}

// 获取学生课程时间表
export const getStudentLessonTable = async (recordId: number | string): Promise<StudentLessonTableResponse> => {
  try {
    const params = new URLSearchParams();
    params.append('record_id', String(recordId));
    const url = `/api/students/get_lesson_table?${params.toString()}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch(url, { method: 'GET', headers });
    const data = await response.json();
    return data as StudentLessonTableResponse;
  } catch (error) {
    console.error('获取学生课程时间表失败:', error);
    return { status: -1, message: '获取学生课程时间表失败', data: {} } as StudentLessonTableResponse;
  }
};

// 学生姓名查询
export interface StudentNameResponse {
  status: number;
  message: string;
  data: string; // 学生姓名
}

export const getStudentName = async (studentId: number | string): Promise<StudentNameResponse> => {
  try {
    const url = `/api/students/student-name/${studentId}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch(url, { method: 'GET', headers });
    const data = await response.json();
    return data as StudentNameResponse;
  } catch (error) {
    console.error('获取学生姓名失败:', error);
    return { status: -1, message: '获取学生姓名失败', data: '' } as StudentNameResponse;
  }
};
