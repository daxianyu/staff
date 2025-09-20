import { normalizeApiResponse, request } from '../apiClient';
import type { ApiResponse } from '../types';

export interface AttendanceListItem {
  start_time: number;
  topic: number;
  topic_name: string;
  subject_id: number;
  students: Array<{
    student_name: string;
    comment: string;
    student_id: number;
    lesson_id: number;
  }>;
}

export interface FeedbackListItem {
  student_id: number;
  subject_id: number;
  student_name: string;
  topic_name: string;
  time_unit: number;
  time_unit_start: number;
  time_unit_end: number;
}

export interface DashboardData {
  attendance_list: AttendanceListItem[];
  feed_back_list: FeedbackListItem[];
}

export const getStaffDashboard = async (): Promise<ApiResponse<DashboardData>> => {
  try {
    const { data } = await request('/api/staff/dashboard');
    return normalizeApiResponse<DashboardData>(data as any);
  } catch (error) {
    console.error('获取员工dashboard异常:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取员工dashboard失败' };
  }
};

export interface UpdateAttendanceParams {
  lesson_id: number;
  attendance_info: Array<{
    student_id: number;
    present: number;
  }>;
}

export const updateAttendance = async (params: UpdateAttendanceParams): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/staff/update_attendance', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('更新考勤异常:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新考勤失败' };
  }
};

export interface UpdateFeedbackParams {
  student_id: number;
  subject_id: number;
  time_unit: number;
  feedback_note: string;
}

export const updateFeedback = async (params: UpdateFeedbackParams): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/staff/update_feedback', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('更新反馈异常:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新反馈失败' };
  }
};

export interface CancelLessonParams {
  record_id: number;
}

export const cancelLesson = async (params: CancelLessonParams): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/staff/cancel_lesson', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('取消课程异常:', error);
    return { code: 500, message: error instanceof Error ? error.message : '取消课程失败' };
  }
};
